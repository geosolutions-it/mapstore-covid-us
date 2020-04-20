/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import join from 'lodash/join';
import find from 'lodash/find';
import min from 'lodash/min';
import max from 'lodash/max';
import flatten from 'lodash/flatten';
import { createPlugin } from '@mapstore/utils/PluginsUtils';
import usePlugins from '@js/hooks/usePlugins';
import BorderLayout from '@mapstore/components/layout/BorderLayout';
import Message from '@mapstore/components/I18N/Message';
import HTML from '@mapstore/components/I18N/HTML';

import usePromise from '@js/hooks/usePromise';
import axios from '@mapstore/libs/ajax';
import { withRouter } from 'react-router';
import Toolbar from '@mapstore/components/misc/toolbar/Toolbar';
import StatesTable from '@js/plugins/dashboardlayout/StatesTable';
import TotalsCounter from '@js/plugins/dashboardlayout/TotalsCounter';
import Flex from '@js/plugins/dashboardlayout/Flex';
import LiveText from '@js/plugins/dashboardlayout/LiveText';
import { getQueryParams, setQueryParams } from '@js/utils/ProjectUtils';
import useDeepCompareEffect from 'use-deep-compare-effect';
const CancelToken = axios.CancelToken;

function DashboardLayout({
    headerLogo = 'static/mapstore-logo.png',
    headerLink = 'https://mapstore2.geo-solutions.it/',
    maxSelectedProperties = 3,
    defaultProperty = 'positive',
    idProperty = 'state',
    stateLabelProperty = 'name',
    liveTextConfirmedProperty = 'positive',
    liveTextDeathsProperty = 'death',
    highlightColor = '#fff65a',
    bbox = [ 144.7694, -13.80, -66.949895, 71.352561 ],
    colors = {
        death: '#000000',
        totalTestResults: '#49b9ff',
        positive: '#ff33aa',
        negative: '#ffaa33',
        recovered: '#93efad',
        hospitalizedCurrently: '#22ad99',
        inIcuCurrently: '#bb5bff',
        onVentilatorCurrently: '#ffaacc'
    },
    vectorLayers = {
        polygon: {
            url: 'static/states-polygon.json'
        },
        centroid: {
            url: 'static/states-centroid.json'
        }
    },
    endpoint = {
        info: {
            url: 'https://covidtracking.com/api/states/info',
            propertiesKeys: ['state', 'name']
        },
        current: {
            url: 'https://covidtracking.com/api/states',
            propertiesKeys: ['state', 'dateModified'],
            countKeys: [
                'totalTestResults',
                'positive',
                'negative',
                'death',
                'recovered',
                'hospitalizedCurrently',
                'inIcuCurrently',
                'onVentilatorCurrently'
            ]
        }
    },
    items,
    history,
    location,
    requestsNeedUpdate,
    requestDate
}, context) {

    const [info, setInfo] = useState({});
    const [total, setTotal] = useState({});
    const [states, setStates] = useState([]);

    const stateTableRef = useRef();

    function handleSelectProperty(selected) {
        const { properties = '', ...query } = getQueryParams(location);
        const oldProperties = properties?.split(',')?.filter?.(val => val) || [];
        const newProperties = oldProperties.indexOf(selected) !== -1
            ? oldProperties.filter(property => property !== selected)
            : [...oldProperties, selected];
        if (newProperties.length > 0) {
            history.push(
                setQueryParams({
                    ...query,
                    properties: newProperties.join(',')
                })
            );
        }
    }

    function handleStatesSelect(properties) {
        const { selected, ...query } = getQueryParams(location);
        history.push(
            setQueryParams({
                ...query,
                ...properties
            })
        );
    }

    function handleStatesSort(properties) {
        const { sort, order, ...query } = getQueryParams(location);
        history.push(
            setQueryParams({
                ...query,
                ...properties
            })
        );
    }

    const query = getQueryParams(location);
    const properties = query?.properties?.split?.(',')?.filter?.(val => val) || [defaultProperty];

    useDeepCompareEffect(() => {
        if (!query?.properties) {
            history.push(
                setQueryParams({
                    ...query,
                    properties: defaultProperty
                })
            );
        }
    }, [ query, history, defaultProperty ]);

    const { pending: pendingInfo } = usePromise({
        promiseFn: (cancelToken) =>
            axios.get(endpoint?.info?.url, {
                cancelToken: new CancelToken(function executor(cancel) {
                    cancelToken(cancel);
                })
            }),
        onResolve: (response) => {
            const availableKeys = [...(endpoint?.info?.propertiesKeys || []), ...(endpoint?.info?.countKeys || [])];
            const newInfo = (response?.data || [])
                .map((entry) => ({
                    ...(availableKeys
                        ? availableKeys.reduce((acc, key) => ({
                            ...acc,
                            [key]: entry[key]
                        }), {})
                        : entry)
                }));
            const newInfoById = newInfo.reduce((acc, entry) => ({
                ...acc,
                [entry[idProperty]]: entry
            }), {});
            setInfo(newInfoById);
        },
        watch: []
    });

    const { pending: pendingCurrent } = usePromise({
        promiseFn: (cancelToken) =>
            axios.get(endpoint?.current?.url, {
                cancelToken: new CancelToken(function executor(cancel) {
                    cancelToken(cancel);
                })
            }),
        onResolve: (response) => {
            const initialProperties = [...(endpoint?.current?.countKeys || [])].reduce((acc, key) => ({ ...acc, [key]: 0 }), {});
            const newTotal = (response?.data || []).reduce((previous, current) => ({
                ...Object.keys(previous).reduce((acc, key) => ({ ...acc, [key]: previous[key] + (current[key] || 0) }), previous)
            }), initialProperties);

            const availableKeys = [...(endpoint?.current?.propertiesKeys || []), ...(endpoint?.current?.countKeys || [])];
            const newStates = (response?.data || [])
                .map((entry) => ({
                    ...(availableKeys
                        ? availableKeys.reduce((acc, key) => ({
                            ...acc,
                            [key]: entry[key]
                        }), {})
                        : entry)
                }));
            setTotal(newTotal);
            setStates(newStates);
        },
        watch: [requestsNeedUpdate]
    });

    const state = useRef({});
    state.current = {
        properties,
        states
    };

    const [domain, setDomain] = useState({ min: 0, max: 0 });

    useEffect(() => {
        const values = flatten(state.current.properties.map((propertyKey) =>
            state.current.states.map((entry) => entry[propertyKey])
                .filter(val => val !== undefined && val !== null)
        ));
        const minValue = min(values) || 0;
        const maxValue = max(values) || 0;
        setDomain({ min: minValue, max: maxValue });
    }, [pendingInfo || pendingCurrent, properties.join(',')]);

    const loadedPluginsKeys = join(Object.keys(context.loadedPlugins || {}), ',');
    const plugins = usePlugins({ items }, context, [loadedPluginsKeys]);
    const buttons = plugins.filter(({ button }) => button).map(({ Component }) => ({ Element: Component }));
    const { Component } = find(plugins, ({ id }) => id === 'map') || {};
    const mapComponent = Component && (
        <Component
            pendingData={pendingInfo || pendingCurrent}
            properties={properties}
            domain={domain}
            data={states}
            info={info}
            colors={colors}
            idProperty={idProperty}
            highlightColor={highlightColor}
            bbox={bbox}
            vectorLayers={vectorLayers}
            stateLabelProperty={stateLabelProperty}
        />) || null;

    const selected = total;

    return (
        <BorderLayout
            className="dashboard-layout"
            header={
                <div className="header">
                    <div className="logo">
                        {headerLink && headerLogo &&
                        <>
                        <a href={headerLink} target="_blank" rel="noopener noreferrer"><Message msgId="customMessages.builtWith" /><img src={headerLogo}/></a>
                        </>}
                    </div>
                    <h1>
                        <Message msgId="customMessages.headerTitle" />
                    </h1>
                    <Toolbar
                        btnDefaultProps={{
                            className: 'square-button',
                            bsStyle: 'primary'
                        }}
                        buttons={buttons}
                    />
                </div>
            }>
            <Flex
                flex={1}
                direction="row"
                fit
                overflow>
                <Flex
                    id="totals-count"
                    overflow>
                    <TotalsCounter
                        data={total}
                        colors={colors}
                        selectEnabled={properties.length < maxSelectedProperties}
                        onSelect={handleSelectProperty}
                        properties={properties}
                    />
                </Flex>
                <Flex
                    flex={1}
                    fit
                    overflow>
                    <Flex
                        flex={1}
                        fit
                        direction="row"
                        overflow>
                        <Flex
                            flex={1}>
                            <LiveText
                                date={requestDate}
                                confirmed={selected[liveTextConfirmedProperty]}
                                deaths={selected[liveTextDeathsProperty]}
                            />
                            <Flex
                                flex={1}>
                                <div
                                    style={{
                                        position: 'absolute',
                                        width: '100%',
                                        height: '100%',
                                        padding: '0.5em'
                                    }}>
                                    {mapComponent}
                                </div>
                            </Flex>
                        </Flex>
                        <Flex
                            className="states-table-col"
                            ref={stateTableRef}>
                            <Flex
                                className="states-table-container"
                                flex={1}
                                id="states-table"
                                overflow>
                                <StatesTable
                                    loading={pendingInfo || pendingCurrent}
                                    data={states}
                                    info={info}
                                    colors={colors}
                                    properties={properties}
                                    domain={domain}
                                    idProperty={idProperty}
                                    stateLabelProperty={stateLabelProperty}
                                    selected={query?.selected}
                                    onSelect={handleStatesSelect}
                                    sort={query?.sort}
                                    order={query?.order}
                                    onSort={handleStatesSort}
                                />
                            </Flex>
                        </Flex>
                    </Flex>
                    <Flex direction="row">
                        <div className="text-box">
                            <HTML msgId="customMessages.builtWithAttribution" />
                        </div>
                        <div
                            className="credits-divider"
                            style={{
                                width: stateTableRef?.current?.clientWidth,
                                minWidth: stateTableRef?.current?.clientWidth
                            }}>
                            <div className="text-box">
                                <HTML msgId="customMessages.sourcesAttribution"/>
                            </div>
                        </div>
                    </Flex>
                </Flex>
            </Flex>
        </BorderLayout>
    );
}

DashboardLayout.contextTypes = {
    loadedPlugins: PropTypes.object
};

const selector = createSelector([
    state => state?.refresh?.count,
    state => state?.refresh?.date
], (requestsNeedUpdate, requestDate) => ({ requestsNeedUpdate, requestDate }));

const DashboardLayoutPlugin = withRouter(connect(selector)(DashboardLayout));

export default createPlugin('DashboardLayout', {
    component: DashboardLayoutPlugin
});
