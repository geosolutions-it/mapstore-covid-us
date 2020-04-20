/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import isNumber from 'lodash/isNumber';
import omit from 'lodash/omit';
import isString from 'lodash/isString';
import { withResizeDetector } from 'react-resize-detector';
import Message from '@mapstore/components/I18N/Message';
import { ZOOM_TO_HOOK, registerHook } from '@js/utils/ProjectUtils';
import Point from 'ol/geom/Point';
import numeral from 'numeral';
import moment from 'moment';
import { reprojectBbox, reproject } from '@mapstore/utils/CoordinatesUtils';
import 'moment-timezone';

function parseBBOXString(geometry) {
    const splitGeometry = geometry.split(',').map(val => parseFloat(val));
    if (splitGeometry.length === 8) {
        return [
            splitGeometry[4],
            splitGeometry[1],
            splitGeometry[2],
            splitGeometry[3]
        ];
    }
    if (splitGeometry.length === 4) {
        return splitGeometry;
    }
    return [-180, -90, 180, 90];
}

function OLInfoSupport({
    map,
    duration = 300,
    width,
    colors,
    properties,
    idProperty,
    supportedLayers,
    stateLabelProperty
}) {

    const [features, setFeatures] = useState([]);
    const [pixel, setPixel] = useState([]);
    const zoneName = moment.tz.guess();
    const timezone = moment.tz(zoneName).zoneAbbr();

    useEffect(() => {
        registerHook(ZOOM_TO_HOOK, (geometry, { padding, maxZoom = 6 }) => {
            if (!geometry) {
                return null;
            }
            const view = map.getView();
            const crs = view.getProjection().getCode();
            if (!isString(geometry) && geometry.length === 2) {
                const coords = reproject(geometry, 'EPSG:4326', crs);
                return view.fit(new Point([coords.x, coords.y]), {
                    padding: padding && [padding.top || 0, padding.right || 0, padding.bottom || 0, padding.left || 0],
                    maxZoom,
                    duration
                });
            }
            const geom = isString(geometry) ? parseBBOXString(geometry) : geometry;
            const { x: maxXCoord } = reproject([180, 0], 'EPSG:4326', crs);
            const [minx, miny, maxx, maxy] = reprojectBbox(geom, 'EPSG:4326', crs, false);
            const extent = minx > maxx
                ? [minx - maxXCoord * 2, miny, maxx, maxy]
                : [minx, miny, maxx, maxy];
            return view.fit(extent, {
                padding: padding && [padding.top || 0, padding.right || 0, padding.bottom || 0, padding.left || 0],
                maxZoom,
                duration
            });
        });
    }, []);

    useEffect(() => {
        const onMoveStart = () => {
            setFeatures([]);
        };
        const onPointerMove = (event) => {
            let newFeatures = [];
            event.map.forEachFeatureAtPixel(event.pixel, (olFeature, layer) => {
                if (supportedLayers.indexOf(layer.get('msId')) !== -1 && features.length === 0) {
                    const { geometry, ...olProperties } = olFeature.getProperties() || {};
                    newFeatures.push({ ...olProperties });
                }
            });
            setFeatures(newFeatures.filter((olFeature, idx) => idx === 0));
            setPixel(event.pixel);
        };
        map.on('movestart', onMoveStart);
        map.on('pointermove', onPointerMove);
        map.getViewport().addEventListener('mouseout', () => { setFeatures([]); }, false);
    }, []);
    return features.length > 0 ? (
        <div
            className="shadow-far"
            style={{
                position: 'absolute',
                left: pixel[0],
                top: pixel[1],
                backgroundColor: '#fff',
                width: 256,
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column',
                pointerEvents: 'none',
                transform: `translateY(-50%) translateX(${ pixel[0] > width / 2 ? 'calc(-100% - 20px)' : '20px'})`
            }}>
            <div
                style={{
                    flex: 1,
                    position: 'relative',
                    overflow: 'auto',
                    padding: 8
                }}>
                {features.map((feature, idx) => {
                    const featureProperties = omit(feature || {}, [ 'name', idProperty ]);
                    return (
                        <div key={idx}>
                            <div><strong>{feature?.[stateLabelProperty] || feature?.[idProperty]}</strong></div>
                            <table style={{ width: '100%' }}>
                                {Object.keys(featureProperties).map((key) => {
                                    const borderStyle = properties.indexOf(key) !== -1
                                        && { borderBottom: `1px solid ${colors[key] || '#333333'}` };
                                    return (
                                        <tr key={key} style={{ fontSize: 10, wordBreak: 'break-word', ...borderStyle }}>
                                            <td><Message msgId={`customMessages.${key}`} /></td>
                                            <td style={{ textAlign: 'right' }}>{isNumber(featureProperties[key])
                                                ? numeral(featureProperties[key]).format('0,0')
                                                : moment(featureProperties[key]).isValid()
                                                    ? moment(featureProperties[key]).format(`h:mm a [${timezone}], Do MMMM YYYY`)
                                                    : featureProperties[key]}</td>
                                        </tr>
                                    );
                                })}
                            </table>
                        </div>
                    );
                })}
            </div>
        </div>
    ) : <span />;
}

export default {
    name: 'infoSupport',
    impl: connect(() => ({}))(
        withResizeDetector(OLInfoSupport)
    )
};
