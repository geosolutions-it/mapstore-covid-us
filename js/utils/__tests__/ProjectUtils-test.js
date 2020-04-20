/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';
import {
    getQueryParams,
    setQueryParams,
    get4326BBOXString,
    getGeometryExtent
} from '../ProjectUtils';

describe('ProjectUtils', () => {
    it('getQueryParams', () => {
        const query = getQueryParams({ search: '?properties=count' });
        expect(query.properties).toBe('count');
    });
    it('setQueryParams', () => {
        const search = setQueryParams({ properties: 'count' });
        expect(search).toBe('?properties=count');
    });
    it('get4326BBOXString (greater than globe)', () => {
        const bbox = {
            bounds: {
                minx: -200,
                miny: -90,
                maxx: 300,
                maxy: 90
            },
            crs: 'EPSG:4326'
        };
        const bboxString = get4326BBOXString(bbox.bounds, bbox.crs);
        const [ minx, miny, maxx, maxy ] = bboxString.split(',');
        expect(Math.round(parseFloat(minx))).toBe(-180);
        expect(Math.round(parseFloat(miny))).toBe(-90);
        expect(Math.round(parseFloat(maxx))).toBe(180);
        expect(Math.round(parseFloat(maxy))).toBe(90);
    });
    it('get4326BBOXString (on international date line)', () => {
        const bbox = {
            bounds: {
                minx: -200,
                miny: -90,
                maxx: -175,
                maxy: 90
            },
            crs: 'EPSG:4326'
        };
        const bboxString = get4326BBOXString(bbox.bounds, bbox.crs);

        const [ minx1, miny1, maxx1, maxy1, minx2, miny2, maxx2, maxy2 ] = bboxString.split(',');
        expect(Math.round(parseFloat(minx1))).toBe(-180);
        expect(Math.round(parseFloat(miny1))).toBe(-90);
        expect(Math.round(parseFloat(maxx1))).toBe(-175);
        expect(Math.round(parseFloat(maxy1))).toBe(90);

        expect(Math.round(parseFloat(minx2))).toBe(160);
        expect(Math.round(parseFloat(miny2))).toBe(-90);
        expect(Math.round(parseFloat(maxx2))).toBe(180);
        expect(Math.round(parseFloat(maxy2))).toBe(90);

    });
    it('get4326BBOXString (inside max min of projection extent)', () => {
        const bbox = {
            bounds: {
                minx: -10,
                miny: -10,
                maxx: 10,
                maxy: 10
            },
            crs: 'EPSG:4326'
        };
        const bboxString = get4326BBOXString(bbox.bounds, bbox.crs);
        const [ minx, miny, maxx, maxy ] = bboxString.split(',');
        expect(Math.round(parseFloat(minx))).toBe(-10);
        expect(Math.round(parseFloat(miny))).toBe(-10);
        expect(Math.round(parseFloat(maxx))).toBe(10);
        expect(Math.round(parseFloat(maxy))).toBe(10);
    });
    it('getGeometryExtent from geometry point', () => {
        const geometry = {
            type: 'Point',
            coordinates: [9, 45]
        };
        const extent = getGeometryExtent(geometry);
        expect(extent).toEqual([9, 45]);
    });
    it('getGeometryExtent from geometry linestring', () => {
        const geometry = {
            type: 'LineString',
            coordinates: [[9, 45], [10, 46]]
        };
        const extent = getGeometryExtent(geometry);
        expect(extent).toBe(null);
    });
    it('getGeometryExtent from geometry polygon', () => {
        const geometry = {
            type: 'Polygon',
            coordinates: [
                [
                    [-10, 20],
                    [10, 20],
                    [10, -20],
                    [-10, -20],
                    [-10, 20]
                ]
            ]
        };
        const extent = getGeometryExtent(geometry);
        expect(extent).toEqual([ -10, -20, 10, 20 ]);
    });
    it('getGeometryExtent from geometry polygon cross date line', () => {
        const geometry = {
            type: 'Polygon',
            coordinates: [
                [
                    [160, 40],
                    [-160, 40],
                    [-160, -40],
                    [160, -40],
                    [160, 40]
                ]
            ]
        };
        const extent = getGeometryExtent(geometry);
        expect(extent).toEqual([ 160, -40, -160, 40 ]);
    });
    it('getGeometryExtent from geometry multipolygon cross date line', () => {
        const geometry = {
            type: 'MultiPolygon',
            coordinates: [
                [
                    [
                        [150, 40],
                        [-150, 40],
                        [-150, -40],
                        [150, -40],
                        [150, 40]
                    ]
                ]
            ]
        };
        const extent = getGeometryExtent(geometry);
        expect(extent).toEqual([ 150, -40, -150, 40 ]);
    });
});
