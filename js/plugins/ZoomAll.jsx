/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { connect } from 'react-redux';
import { createPlugin } from '@mapstore/utils/PluginsUtils';
import { Button as ButtonRB, Glyphicon } from 'react-bootstrap';
import tooltip from '@mapstore/components/misc/enhancers/buttonTooltip';
import { withRouter } from 'react-router';
import { createSelector } from 'reselect';
import { zoomTo } from '@js/actions/mapviewer';
const Button = tooltip(ButtonRB);

function ZoomAll({
    bbox,
    onZoom
}) {
    return (
        <Button
            className="square-button"
            bsStyle="primary"
            tooltipId="zoombuttons.zoomAllTooltip"
            tooltipPosition="left"
            onClick={() => onZoom(bbox)}>
            <Glyphicon glyph="resize-full"/>
        </Button>
    );
}

const ZoomAllPlugin = connect(createSelector([
    state => state?.controls?.map?.maxBbox || [-180, -90, 180, 90]
], (bbox) => ({
    bbox
})), { onZoom: zoomTo })(ZoomAll);

export default createPlugin('ZoomAll', {
    component: withRouter(ZoomAllPlugin),
    containers: {
        Toolbar: {
            name: 'ZoomAll',
            position: 7,
            tool: true,
            priority: 1
        }
    }
});
