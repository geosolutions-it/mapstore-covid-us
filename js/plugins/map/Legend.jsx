/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import React, { useState } from 'react';
import _range from 'lodash/range';
import { interpolateNumber } from 'd3-interpolate';
import useDeepCompareEffect from 'use-deep-compare-effect';
import numeral from 'numeral';
import Message from '@mapstore/components/I18N/Message';

function Legend({
    domain,
    range,
    classes = 4,
    properties,
    colors
}) {

    const [markers, setMarkers] = useState([]);

    useDeepCompareEffect(() => {
        const interpolateRange = interpolateNumber(range[0], range[1]);
        const interpolateDomain = interpolateNumber(domain?.min, domain?.max);
        setMarkers(
            [..._range(classes).map((idx) => {
                const value = (idx + 1) / classes;
                return {
                    size: interpolateRange(value),
                    label: numeral(interpolateDomain(value)).format('Oa')
                };
            })].reverse()
        );
    }, [domain, range, classes]);

    const margin = 6;
    const maxMarkerSize = range[1] * 2;
    const legendWidth = maxMarkerSize * 1.5;
    return (
        <div className="legend">
            <svg
                viewBox={`0 0 ${legendWidth + margin * 2} ${maxMarkerSize + margin * 2}`}
                style={{
                    width: legendWidth + margin * 2,
                    height: maxMarkerSize + margin * 2
                }}>
                {markers.map((marker, idx) => {
                    return (
                        <>
                        <circle
                            key={idx + 'circle'}
                            cx={maxMarkerSize / 2 + margin}
                            cy={margin + maxMarkerSize - marker.size}
                            r={marker.size}
                        />
                        <text
                            key={idx + 'text'}
                            x={maxMarkerSize + margin * 2}
                            y={margin + maxMarkerSize - (marker.size * 2)}
                            alignmentBaseline="hanging"
                        >
                            {marker.label}
                        </text>
                        </>
                    );
                })}
            </svg>
            <ul>
                {properties.map((propertyKey, idx) => {
                    return (
                        <li key={idx}>
                            <div style={{
                                width: 12,
                                height: 12,
                                display: 'inline-block',
                                backgroundColor: colors[propertyKey],
                                marginRight: 4
                            }}></div>
                            <Message msgId={`customMessages.${propertyKey}`}/>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

export default Legend;
