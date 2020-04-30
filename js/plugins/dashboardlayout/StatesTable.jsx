/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useMemo } from 'react';
import isNaN from 'lodash/isNaN';
import Message from '@mapstore/components/I18N/Message';
import { scaleLinear } from 'd3-scale';
import { Button as ButtonRB, Glyphicon } from 'react-bootstrap';
import tooltip from '@mapstore/components/misc/enhancers/tooltip';
import Loader from '@mapstore/components/misc/Loader';
import numeral from 'numeral';
import useDeepCompareEffect from 'use-deep-compare-effect';
import isEmpty from 'lodash/isEmpty';

const Button = tooltip(ButtonRB);

function StatesTable({
    selected,
    loading,
    data = [],
    info = {},
    properties = [],
    colors = {},
    domain = { min: 0, max: 0 },
    idProperty,
    stateLabelProperty,
    onSort = () => {},
    onSelect = () => {},
    order = 'asc',
    sort = ''
}) {

    function handleSort(key, defaultOrder) {
        if (sort === key) {
            return onSort({
                sort: key,
                order: order === 'asc' ? 'des' : 'asc'
            });
        }
        return onSort({
            sort: key,
            order: defaultOrder
        });
    }

    const states = useMemo(() => {
        const minValue = domain?.min || 0;
        const maxValue = domain?.max || 0;
        const scale = scaleLinear()
            .domain([minValue, maxValue])
            .range([4, 200]);
        const newData = data.map((entry) => ({
            ...entry,
            bars: properties.map((propertyKey) => ({
                key: propertyKey,
                size: scale(entry[propertyKey]),
                fill: colors?.[propertyKey] || '#333333'
            }))
        }));
        return [ ...newData]
            .sort((a, b) => {
                if (order === 'asc') {
                    return a[sort] > b[sort] ? 1 : -1;
                }
                return a[sort] > b[sort] ? -1 : 1;
            });
    }, [
        sort,
        order,
        loading,
        properties,
        domain,
        data,
        colors
    ]);

    useDeepCompareEffect(() => {
        if (!sort && properties?.[0]
        || sort && sort !== idProperty && properties.indexOf(sort) === -1) {
            onSort({
                sort: properties[0],
                order: 'des'
            });
        }
    }, [ sort, properties, states ]);

    if (isEmpty(states)) {
        return (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                <Loader size={70} />
            </div>
        );
    }

    return (
        <table className="states-table">
            <thead>
                <tr>
                    <th>
                        <div className="states-btn">
                            {loading && <Loader size={16}/>}
                            <Button
                                bsSize="xs"
                                onClick={() => handleSort(idProperty, 'asc')}>
                                <Message msgId={`customMessages.${idProperty}`}/>
                            </Button>
                            {sort === idProperty && <Glyphicon glyph={order === 'asc' ? 'chevron-up' : 'chevron-down'}/>}
                        </div>
                    </th>
                    {properties.map((propertyKey) =>
                        <th key={propertyKey}>
                            <div className="states-btn">
                                <Button
                                    bsSize="xs"
                                    style={{ borderBottom: `2px solid ${colors[propertyKey]}`}}
                                    tooltipId={`customMessages.${propertyKey}`}
                                    onClick={() => handleSort(propertyKey, 'des')}>
                                    <Message msgId={`customMessages.${propertyKey}`}/>
                                </Button>
                                {propertyKey === sort && <Glyphicon glyph={order === 'asc' ? 'chevron-up' : 'chevron-down'}/>}
                            </div>
                        </th>
                    )}
                    <th></th>
                </tr>
            </thead>
            <tbody>
                {states.map((entry) => {
                    const barHeight = 28 / entry.bars.length;
                    const stateLabel = info?.[entry[idProperty]]?.[stateLabelProperty] || entry[idProperty];
                    return (
                        <tr
                            className="state-row"
                            key={entry[idProperty]}>
                            <td><Button
                                bsSize="xs"
                                disabled={loading}
                                bsStyle={entry[idProperty] === selected ? 'primary' : 'default'}
                                tooltip={stateLabel}
                                tooltipPosition="left"
                                onClick={() => {
                                    if (!loading) {
                                        onSelect(entry[idProperty] !== selected && { selected: entry[idProperty] });
                                    }
                                }}>{stateLabel}</Button></td>
                            {properties.map((propertyKey) => <td key={propertyKey}>{numeral(entry[propertyKey]).format('0,0')}</td>)}
                            <td>
                                <svg viewBox={`0 0 200 ${entry.bars.length * barHeight}`} style={{ width: 200, height: entry.bars.length * barHeight }}>
                                    {entry.bars.map(({ size, fill }, idx) => !isNaN(size) && size !== Infinity && size !== -Infinity
                                        && <rect key={idx} x={0} y={idx * barHeight} width={size} height={barHeight - 4} fill={fill}/>)}
                                </svg>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}

export default StatesTable;
