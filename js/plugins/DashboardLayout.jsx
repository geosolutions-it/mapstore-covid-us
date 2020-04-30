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
import LiveText from '@js/plugins/dashboardlayout/LiveText';
import { getQueryParams, setQueryParams } from '@js/utils/ProjectUtils';
import ExpandableChart from '@js/plugins/dashboardlayout/Chart';
import { Observable } from 'rxjs';
import { LOCAL_CONFIG_LOADED } from '@mapstore/actions/localConfig';
import { MAP_CONFIG_LOADED } from '@mapstore/actions/config';
import { setupTutorial } from '@mapstore/actions/tutorial';
import { replace, LOCATION_CHANGE } from 'connected-react-router';
import { setControlProperty } from '@mapstore/actions/controls';
import { getConfigProp } from '@mapstore/utils/ConfigUtils';

const CancelToken = axios.CancelToken;

const mcuInitProject = (action$, store) =>
    action$.ofType(LOCAL_CONFIG_LOADED).switchMap(() =>
        action$.ofType(MAP_CONFIG_LOADED)
            .switchMap(() => {
                const state = store.getState();
                const tutorialPresetList = state?.tutorial?.presetList || {};
                const tutorialKey = 'covid';
                return Observable.of(
                    setupTutorial(tutorialKey, tutorialPresetList[tutorialKey]),
                    setControlProperty('dashboardlayout', 'loading', false)
                );
            })
    );

const mcCheckLocationChange = (action$) =>
    action$.ofType(LOCATION_CHANGE)
        .switchMap((action) => {
            const location = action?.payload?.location;
            const query = getQueryParams(location);
            const  { defaultQueryProperties = ['positive'] } = getConfigProp('mcConfig') || {};
            return !query?.properties
                ? Observable.of(replace(setQueryParams({
                    ...query,
                    properties: defaultQueryProperties.join(','),
                    sort: defaultQueryProperties[0],
                    order: 'des'
                })))
                : Observable.empty();
        });

function DashboardLayoutComponent({
    headerLogo = 'static/mapstore-logo.png',
    headerLink = 'https://mapstore2.geo-solutions.it/',
    items,
    history,
    location,
    requestsNeedUpdate,
    requestDate,
    loadedPlugins
}) {

    const {
        maxSelectedProperties,
        idProperty,
        stateLabelProperty,
        liveTextConfirmedProperty,
        liveTextDeathsProperty,
        highlightColor,
        bbox,
        colors,
        vectorLayers,
        endpoint
    } = getConfigProp('mcConfig') || {};

    const [info, setInfo] = useState({});
    const [total, setTotal] = useState({});
    const [states, setStates] = useState([]);

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
    const properties = query?.properties?.split?.(',')?.filter?.(val => val) || [];

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


    const [loadingLayers, setLoadingLayers] = useState(true);

    const loadedPluginsKeys = join(Object.keys(loadedPlugins || {}), ',');
    const plugins = usePlugins({ items }, { loadedPlugins }, [loadedPluginsKeys]);
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
            onLoad={setLoadingLayers}
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

            <div className="dashboard-layout-body">

                <div className="dashboard-layout-count-group">
                    <div
                        id="totals-count"
                        className="totals-count">
                        <TotalsCounter
                            data={total}
                            colors={colors}
                            selectEnabled={properties.length < maxSelectedProperties}
                            onSelect={handleSelectProperty}
                            properties={properties}
                        />
                    </div>
                    <div className="map-viewer-col">
                        <LiveText
                            date={requestDate}
                            confirmed={selected[liveTextConfirmedProperty]}
                            deaths={selected[liveTextDeathsProperty]}
                        />
                        <div className="map-viewer-container">
                            <div>
                                {mapComponent}
                            </div>
                        </div>
                        <ExpandableChart
                            endpoint={endpoint}
                            properties={properties}
                            colors={colors}
                            selected={query?.selected}
                            stateLabelProperty={stateLabelProperty}
                            info={info}
                        />
                    </div>
                </div>

                <div className="states-table-col">
                    <div
                        className="states-table-container"
                        id="states-table">
                        <StatesTable
                            loading={pendingInfo || pendingCurrent || loadingLayers}
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
                    </div>

                    <div className="attributions-container">
                        <div className="text-box">
                            <p><small><HTML msgId="customMessages.requestDateMessage" /></small></p>
                            <p>
                                <HTML msgId="customMessages.sourcesAttribution"/>
                            </p>
                            <p>
                                <HTML msgId="customMessages.builtWithAttribution" />
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </BorderLayout>
    );
}

const DashboardLayout = ({ loading, ...props}, context) => {
    if (loading) {
        return (
            <>
            <div className="_ms2_init_spinner _ms2_init_center">
                <div></div>
            </div>
            <div className="_ms2_init_text _ms2_init_center">Loading MapStore</div>
            </>
        );
    }
    return <DashboardLayoutComponent { ...props } loadedPlugins={context.loadedPlugins} />;
};

DashboardLayout.contextTypes = {
    loadedPlugins: PropTypes.object
};


const selector = createSelector([
    state => state?.refresh?.count,
    state => state?.refresh?.date,
    state => state?.controls?.dashboardlayout?.loading ?? true
], (requestsNeedUpdate, requestDate, loading) => ({ requestsNeedUpdate, requestDate, loading }));

const DashboardLayoutPlugin = withRouter(connect(selector)(DashboardLayout));

export default createPlugin('DashboardLayout', {
    component: DashboardLayoutPlugin,
    epics: {
        mcuInitProject,
        mcCheckLocationChange
    }
});
