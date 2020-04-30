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
import { setControlProperties } from '@mapstore/actions/controls';
import exitFullscreen from '../../themes/default/svg/exit-full-screen-w.svg';
const Button = tooltip(ButtonRB);

function FullScreen({
    fullscreen,
    onClick
}) {
    return (
        <Button
            className="square-button"
            bsStyle="primary"
            tooltipId={fullscreen ? 'fullscreen.tooltipDeactivate' : 'fullscreen.tooltipActivate'}
            tooltipPosition="left"
            onClick={() => onClick(!fullscreen)}>
            {fullscreen
                ? <img src={exitFullscreen} width={26} height="auto"/>
                : <Glyphicon glyph="1-full-screen"/>}
        </Button>
    );
}

const FullScreenPlugin = connect(createSelector([
    state => state?.controls?.map?.fullscreen || false
], (fullscreen) => ({
    fullscreen
})), { onClick: setControlProperties.bind(null, 'map', 'fullscreen') })(FullScreen);

export default createPlugin('FullScreen', {
    component: withRouter(FullScreenPlugin),
    containers: {
        Toolbar: {
            name: 'FullScreen',
            position: 5,
            tool: true,
            priority: 1
        }
    }
});
