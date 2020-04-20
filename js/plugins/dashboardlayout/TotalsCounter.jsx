/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Message from '@mapstore/components/I18N/Message';
import numeral from 'numeral';

function Counter({
    property,
    count,
    color,
    onSelect,
    selected,
    selectEnabled
}) {
    const enabled = selectEnabled || selected && !selectEnabled;
    return (
        <div
            className={`counter${selected ? ' selected' : ''}${enabled ? ' enabled' : ''}`}
            onClick={enabled ? onSelect : () => {}}
            style={{
                ...(selected && { borderBottom: `4px solid ${color}` }),
                ...(!enabled && { cursor: 'not-allowed' })
            }}>
            <div className="title"><Message msgId={`customMessages.${property}`}/></div>
            <div className="count">{numeral(count).format('0,0')}</div>
        </div>
    );
}

function TotalsCounter({
    data = {},
    colors = {},
    properties = [],
    onSelect = () => {},
    selectEnabled
}) {
    return (
        <>
            {Object.keys(data).map(key => (
                <Counter
                    key={key}
                    property={key}
                    count={data[key]}
                    color={colors[key]}
                    selected={properties.indexOf(key) !== -1}
                    selectEnabled={selectEnabled}
                    onSelect={() => onSelect(key)}
                />
            ))}
        </>
    );
}

export default TotalsCounter;
