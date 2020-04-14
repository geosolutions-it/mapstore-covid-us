/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import LocaleUtils from '@mapstore/utils/LocaleUtils';
import StandardApp from '@mapstore/components/app/StandardApp';
import StandardRouterComponent from '@mapstore/components/app/StandardRouter';
import StandardStore from '@mapstore/stores/StandardStore';
import maptype from '@mapstore/reducers/maptype';
import { setSupportedLocales } from '@mapstore/epics/localconfig';
import 'regenerator-runtime';
import axios from '@mapstore/libs/ajax';
import rxjsConfig from 'recompose/rxjsObservableConfig';
import { setObservableConfig } from 'recompose';
import { setLocalConfigurationFile } from '@mapstore/utils/ConfigUtils';
setLocalConfigurationFile('localConfig.json');
setObservableConfig(rxjsConfig);

const version = __MS_VERSION__;  // eslint-disable-line no-undef

// list of path that need version parameter
const pathsNeedVersion = [
    'localConfig.json',
    'map.json',
    'translations/',
    'print.json'
];

axios.interceptors.request.use(
    config => {
        if (config.url && version && pathsNeedVersion.filter(url => config.url.match(url))[0]) {
            return {
                ...config,
                params: {
                    ...config.params,
                    v: version
                }
            };
        }
        return config;
    }
);

import pluginsDef from './plugins';
import config from './appConfig';

const startApp = () => {
    const { pages, initialState, storeOpts, appEpics = {}, themeCfg } = config;

    const StandardRouter = connect((state) => ({
        locale: state.locale || {},
        pages
    }))(StandardRouterComponent);

    const appStore = StandardStore.bind(null, initialState, {
        maptype
    }, {
        ...appEpics,
        setSupportedLocales
    });

    const initialActions = [];

    const appConfig = {
        storeOpts,
        appEpics,
        appStore,
        pluginsDef,
        initialActions,
        appComponent: StandardRouter,
        printingEnabled: true,
        themeCfg
    };

    ReactDOM.render(
        <StandardApp {...appConfig}/>,
        document.getElementById('container')
    );
};

if (!global.Intl ) {
    // Ensure Intl is loaded, then call the given callback
    LocaleUtils.ensureIntl(startApp);
} else {
    startApp();
}
