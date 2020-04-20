/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import url from 'url';
import join from 'lodash/join';
import minBy from 'lodash/minBy';
import maxBy from 'lodash/maxBy';
import flatten from 'lodash/flatten';
import { reprojectBbox, getViewportGeometry } from '@mapstore/utils/CoordinatesUtils';

export const ZOOM_TO_HOOK = 'ZOOM_TO_HOOK';

let hooks = {};

export function registerHook(name, hook) {
    hooks[name] = hook;
}

export function getHook(name) {
    return hooks[name];
}

export const getQueryParams = ({ search }) => {
    const { query } = url.parse(search, true);
    return query || {};
};

export const setQueryParams = (query) => {
    return url.format({ query });
};

export const get4326BBOXString = function(bounds, crs) {
    const { extent } = getViewportGeometry(bounds, crs);
    const extents = extent.length === 2
        ? extent
        : [ extent ];
    const reprojectedExtents = crs === 'EPSG:4326'
        ? extents
        : extents.map(ext => reprojectBbox(ext, crs, 'EPSG:4326'));
    return join(reprojectedExtents.map(ext => join(ext.map((val) => val.toFixed(4)), ',')), ',');
};

const computeBbox = (coordinates) => {
    const miny = minBy(coordinates, (coords) => coords[1])[1];
    const maxy = maxBy(coordinates, (coords) => coords[1])[1];
    const leftCoordinates = coordinates.filter(coords => coords[0] < 0);
    const rightCoordinates = coordinates.filter(coords => coords[0] >= 0);
    if (leftCoordinates.length > 0 && rightCoordinates.length > 0) {
        const minxR = minBy(rightCoordinates, (coords) => coords[0])[0];
        const maxxR = maxBy(rightCoordinates, (coords) => coords[0])[0];
        const minxL = minBy(leftCoordinates, (coords) => coords[0])[0];
        const maxxL = maxBy(leftCoordinates, (coords) => coords[0])[0];
        const centerR = minxR + (maxxR - minxR) / 2;
        const centerL = minxL + (maxxL - minxL) / 2;
        if (centerR > 90 && centerL < -90) {
            return [
                minxR,
                miny,
                maxxL,
                maxy
            ];
        }
    }
    const minx = minBy(coordinates, (coords) => coords[0])[0];
    const maxx = maxBy(coordinates, (coords) => coords[0])[0];
    return [minx, miny, maxx, maxy];
};

export const getGeometryExtent = (geometry) => {
    if (!geometry) {
        return null;
    }
    if (geometry.type === 'Point') {
        return geometry?.coordinates;
    }
    if (geometry.type === 'Polygon') {
        const flatCoordinates = flatten(geometry?.coordinates);
        return computeBbox(flatCoordinates);
    }
    if (geometry.type === 'MultiPolygon') {
        const flatCoordinates = flatten(geometry?.coordinates.map((coordinates) => flatten(coordinates)));
        return computeBbox(flatCoordinates);
    }
    return null;
};
