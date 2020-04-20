/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import join from 'lodash/join';
import find from 'lodash/find';
import flatten from 'lodash/flatten';
import isArray from 'lodash/isArray';
import { createPlugin } from '@mapstore/utils/PluginsUtils';
import usePlugins from '@js/hooks/usePlugins';
import { MapPlugin as MSMapPlugin, reducers, epics } from '@mapstore/plugins/Map';
import usePromise from '@js/hooks/usePromise';
import axios from '@mapstore/libs/ajax';
import { addLayer, removeLayer, updateNode, moveNode } from '@mapstore/actions/layers';
import { setControlProperties } from '@mapstore/actions/controls';
import { resizeMap } from '@mapstore/actions/map';
import { scaleLinear } from 'd3-scale';
import useDeepCompareEffect from 'use-deep-compare-effect';
import { withResizeDetector } from 'react-resize-detector';
import { mapSelector } from '@mapstore/selectors/map';
import loadingState from '@mapstore/components/misc/enhancers/loadingState';
import InfoSupport from '@js/plugins/map/InfoSupport';
import Legend from '@js/plugins/map/Legend';
import { CUSTOM_ZOOM_TO, zoomTo } from '@js/actions/mapviewer';
import { Observable } from 'rxjs';
import { withRouter } from 'react-router';
import { getQueryParams, getGeometryExtent, ZOOM_TO_HOOK, getHook } from '@js/utils/ProjectUtils';
import { getConfigProp } from '@mapstore/utils/ConfigUtils';
const CancelToken = axios.CancelToken;

const customZoomToEpic = (action$) =>
    action$.ofType(CUSTOM_ZOOM_TO)
        .switchMap(action => {
            const zoomToHook = getHook(ZOOM_TO_HOOK);
            if (zoomToHook) {
                zoomToHook(action.extent, action.options || {});
            }
            return Observable.empty();
        });

const tools = [
    {
        openlayers: InfoSupport
    }
];

const useVectorLayer = ({
    id,
    url,
    onAddLayer,
    onRemoveLayer,
    info,
    data,
    style,
    onUpdateNode,
    idProperty
}) => {
    const [features, setFeatures] = useState([]);
    const [loading, setLoading] = useState(true);
    usePromise({
        promiseFn: (cancelToken) =>
            axios.get(url, {
                cancelToken: new CancelToken(function executor(cancel) {
                    cancelToken(cancel);
                })
            }),
        onResolve: (response) => {
            const newFeatures = [...response?.data?.features] || [];
            setFeatures(newFeatures);
            onAddLayer({
                id: id,
                name: id,
                title: id,
                type: 'vector',
                features: newFeatures,
                style
            });
            setLoading(false);
        },
        onReject: () => {
            setLoading(false);
        },
        watch: []
    });
    useEffect(() => {
        return () => {
            onRemoveLayer(id);
        };
    }, []);
    useDeepCompareEffect(() => {
        const dataByState = data.reduce((acc, entry) => ({ ...acc, [entry[idProperty]]: { ...entry } }), {});
        const newFeatures = features.map((feature) => ({
            ...feature,
            extent: getGeometryExtent(feature?.geometry),
            properties: {
                ...info[feature.properties[idProperty]],
                ...dataByState[feature.properties[idProperty]]
            }
        }));
        setFeatures(newFeatures);
        onUpdateNode(id, 'layers', { features: newFeatures });
    }, [info, features, data]);
    return { loading, features };
};

function MapViewerPlugin({
    items,
    onAddLayer,
    onRemoveLayer,
    onUpdateNode,
    properties,
    domain,
    data,
    info,
    colors,
    height,
    width,
    onResize,
    onZoomTo,
    onMove,
    location,
    highlightColor,
    updateMaxBbox,
    mapFullscreen,
    idProperty,
    bbox,
    vectorLayers,
    stateLabelProperty,
    containerNode = document.querySelector('.' + (getConfigProp('themePrefix') || 'ms2') + " > div") || document.body,
    ...props
}, context) {

    useDeepCompareEffect(() => {
        updateMaxBbox(bbox);
    }, [ bbox, updateMaxBbox ]);

    const {
        bbox: bboxString,
        selected
    } = getQueryParams(location);

    const layerCentroidId = 'states-centroid';
    const { loading: loadingCentroid, features } = useVectorLayer({
        id: layerCentroidId,
        info,
        data,
        url: vectorLayers?.centroid?.url,
        onAddLayer,
        onRemoveLayer,
        onUpdateNode,
        idProperty
    });

    const layerPolygonId = 'states-polygon';
    const { loading: loadingPolygon, features: polygonFeatures } = useVectorLayer({
        id: layerPolygonId,
        info,
        data,
        url: vectorLayers?.polygon?.url,
        onAddLayer,
        onRemoveLayer,
        onUpdateNode,
        idProperty,
        style: {
            fillColor: '#ffffff',
            fillOpacity: 0.05,
            color: '#ffffff',
            opacity: 0.05
        }
    });

    useDeepCompareEffect(() => {
        if (isArray(features) && isArray(data) && properties && domain) {
            const minValue = domain?.min || 0;
            const maxValue = domain?.max || 0;
            const scale = scaleLinear()
                .domain([minValue, maxValue])
                .range([2, 50]);
            const keyValues = data.reduce((acc, entry) => ({
                ...acc,
                [entry[idProperty]]: properties.map((property) => scale(entry[property]) || 0)
            }), {});
            const newFeatures = flatten(features.map((feature) => {
                const featuresWithStyle = keyValues?.[feature.properties[idProperty]]?.map((value, idx) => ({
                    ...feature,
                    style: {
                        fillColor: colors[properties[idx]],
                        fillOpacity: 0.5,
                        color: colors[properties[idx]],
                        opacity: 0.8,
                        radius: value
                    }
                })) || [];
                return  [...featuresWithStyle].sort((a, b) =>
                    a?.style?.radius > b?.style?.radius ? -1 : 1
                ) || [];
            }) || []);
            onUpdateNode(layerCentroidId, 'layers', {
                features: newFeatures
            });
        }
    }, [ features, data, properties, domain ]);


    useEffect(() => {
        if (!loadingPolygon && !loadingCentroid) {
            onMove(layerCentroidId, 'Default', 0);
        }
    }, [
        loadingPolygon,
        loadingCentroid,
        layerCentroidId
    ]);

    useEffect(() => {
        onResize();
    }, [ width, height, loadingCentroid ]);


    useDeepCompareEffect(() => {
        if (!loadingPolygon && !loadingCentroid && polygonFeatures && features) {
            const { extent } = find(polygonFeatures, (feature) => feature?.properties?.[idProperty] === selected) || {};
            const { extent: point } = find(features, (feature) => feature?.properties?.[idProperty] === selected) || {};
            onZoomTo(extent
                ? extent
                : point || bboxString || bbox);
            onUpdateNode(layerPolygonId, 'layers', {
                features: polygonFeatures.map((feature) => ({
                    ...feature,
                    style: feature?.properties?.[idProperty] === selected
                        ? {
                            fillColor: highlightColor,
                            fillOpacity: 0.1,
                            color: highlightColor,
                            opacity: 0.7,
                            weight: 2
                        }
                        : {
                            fillColor: '#ffffff',
                            fillOpacity: 0.05,
                            color: '#ffffff',
                            opacity: 0.05
                        }
                }))
            });
        }
    }, [
        loadingPolygon,
        loadingCentroid,
        selected,
        polygonFeatures,
        features,
        bboxString,
        bbox
    ]);

    const loadedPluginsKeys = join(Object.keys(context.loadedPlugins || {}), ',');
    const plugins = usePlugins({ items }, context, [ loadedPluginsKeys ]);
    const components = plugins.map(({ Component }, idx) => <Component key={idx} />);

    const mapViewer = (
        <div
            id="map-container"
            className="map-container">
            <MSMapPlugin
                fonts={null}
                {...props}
                tools={tools}
                toolsOptions={{
                    ...props?.toolsOptions,
                    infoSupport: {
                        ...props?.toolsOptions?.infoSupport,
                        properties,
                        colors,
                        idProperty,
                        supportedLayers: [
                            layerCentroidId,
                            layerPolygonId
                        ],
                        stateLabelProperty
                    }
                }}
            />
            <Legend
                domain={domain}
                range={[2, 50]}
                properties={properties}
                colors={colors}
            />
            {components}
        </div>
    );

    return mapFullscreen && containerNode
        ? createPortal(<div
            style={{
                position: 'fixed',
                width: '100%',
                height: '100%',
                padding: 16,
                top: 0,
                left: 0,
                backgroundColor: `rgba(0, 0, 0, 0.2)`
            }}
        >{mapViewer}</div>, containerNode)
        : mapViewer;
}

MapViewerPlugin.contextTypes = {
    loadedPlugins: PropTypes.object
};

const selector = createSelector(
    [
        mapSelector,
        state => state?.mapInitialConfig?.loadingError,
        state => state?.controls?.map?.fullscreen || false
    ], (map, loadingError, mapFullscreen) => ({
        map,
        loadingError,
        mapFullscreen
    })
);

export default createPlugin('MapViewer', {
    component: connect(selector, {
        onAddLayer: addLayer,
        onRemoveLayer: removeLayer,
        onUpdateNode: updateNode,
        onResize: resizeMap,
        onZoomTo: zoomTo,
        onMove: moveNode,
        updateMaxBbox: setControlProperties.bind(null, 'map', 'maxBbox')
    })(
        loadingState(({ map, loadingError }) => !map && !loadingError)(withRouter(withResizeDetector(MapViewerPlugin)))
    ),
    reducers,
    epics: {
        ...epics,
        customZoomToEpic
    }
});
