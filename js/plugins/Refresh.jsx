/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { createPlugin } from '@mapstore/utils/PluginsUtils';
import { DropdownButton as DropdownButtonRB, MenuItem, Glyphicon } from 'react-bootstrap';
import tooltip from '@mapstore/components/misc/enhancers/buttonTooltip';
import Message from '@mapstore/components/I18N/Message';
import { Observable } from 'rxjs';
import { createSelector } from 'reselect';

const DropdownButton = tooltip(DropdownButtonRB);

const SET_REFRESH_VALUE = 'REFRESH:SET_REFRESH_VALUE';
const UPDATE_REFRESH = 'REFRESH:UPDATE_REFRESH';

const setRefreshInterval = (interval) => ({ type: SET_REFRESH_VALUE, interval });
const updateRefresh = (value) => ({ type: UPDATE_REFRESH, value });

function refresh(state = { count: 0 }, action) {
    switch (action.type) {
    case SET_REFRESH_VALUE:
        return {
            ...state,
            interval: action.interval,
            count: 0
        };
    case UPDATE_REFRESH:
        return {
            ...state,
            count: state.count + 1,
            date: Date.now()
        };
    default:
        return state;
    }
}

const customRefreshTimer = (action$) =>
    action$.ofType(SET_REFRESH_VALUE)
        .switchMap(action => {
            if (!action?.interval?.value) {
                return Observable.empty();
            }
            return Observable.timer(0, action?.interval?.value)
                .switchMap(() => {
                    return Observable.of(updateRefresh());
                });
        });

function Refresh({
    defaultInterval = {
        value: 15 * 60 * 1000,
        labelId: 'customMessages.15Minutes'
    },
    selectedInterval,
    onSelect = () => {},
    intervals = [
        {
            value: 0,
            labelId: 'customMessages.neverRefresh'
        },
        {
            value: 15 * 60 * 1000,
            labelId: 'customMessages.15Minutes'
        },
        {
            value: 30 * 60 * 1000,
            labelId: 'customMessages.30Minutes'
        },
        {
            value: 60 * 60 * 1000,
            labelId: 'customMessages.1Hour'
        }
    ]
}) {
    const state = useRef({});

    state.current = {
        selectedInterval,
        defaultInterval
    };

    useEffect(() => {
        if (!state?.current?.selectedInterval) {
            onSelect(state.current.defaultInterval);
        }
    }, []);

    return (
        <DropdownButton
            id="refresh-button"
            className="square-button"
            bsStyle="primary"
            tooltipId="customMessages.refreshRequest"
            tooltipPosition="bottom"
            title={<Glyphicon glyph="refresh"/>}
            noCaret
            pullRight>
            <MenuItem header><Message msgId="customMessages.refreshRequestTitle" /></MenuItem>
            {intervals.map((interval, idx) => {
                return (
                    <MenuItem
                        key={idx}
                        active={selectedInterval?.value === interval.value || !selectedInterval && interval.value === 0}
                        onSelect={() => onSelect(interval)}>
                        <Message msgId={interval.labelId} />
                    </MenuItem>
                );
            })}
        </DropdownButton>
    );
}

const RefreshPlugin = connect(
    createSelector([ state => state?.refresh?.interval ], (selectedInterval) => ({ selectedInterval})),
    { onSelect: setRefreshInterval }
)(Refresh);

export default createPlugin('Refresh', {
    component: RefreshPlugin,
    reducers: {
        refresh
    },
    epics: {
        customRefreshTimer
    }
});
