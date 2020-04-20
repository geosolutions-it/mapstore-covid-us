/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import { createPlugin } from '@mapstore/utils/PluginsUtils';
import { Button as ButtonRB, Glyphicon } from 'react-bootstrap';
import { success } from '@mapstore/actions/notifications';
import { mapSelector } from '@mapstore/selectors/map';
import CopyToClipboard from 'react-copy-to-clipboard';
import tooltip from '@mapstore/components/misc/enhancers/buttonTooltip';
import { get4326BBOXString, getQueryParams, setQueryParams } from '@js/utils/ProjectUtils';
import { withRouter } from 'react-router';
import { createSelector } from 'reselect';
import url from 'url';
const Button = tooltip(ButtonRB);

function Share({
    bbox,
    onClick,
    location
}) {

    const permalink = useMemo(() => {
        if (location) {
            const hashQuery = getQueryParams(location);
            const hash = setQueryParams({
                ...hashQuery,
                ...(bbox && { bbox })
            });
            const urlParams = url.parse(window.location.href);
            return url.format({ ...urlParams, hash });
        }
        return '';
    }, [bbox, location?.search]);

    return (
        <CopyToClipboard
            text={permalink}
            onCopy={() => {
                onClick({
                    id: 'permalink',
                    title: 'customMessages.copyLink',
                    message: 'customMessages.copyLinkText',
                    position: "tr",
                    autoDismiss: 5,
                    style: {
                        margin: '60px 0 0 0'
                    }
                });
            }}>
            <Button
                id="share-button"
                className="square-button"
                bsStyle="primary"
                tooltipId="customMessages.shareButton"
                tooltipPosition="bottom">
                <Glyphicon glyph="share"/>
            </Button>
        </CopyToClipboard>
    );
}

const SharePlugin = connect(createSelector([mapSelector], (map) => ({
    bbox: map?.bbox?.bounds && map?.bbox?.crs && get4326BBOXString(map.bbox.bounds, map.bbox.crs) || ''
})), { onClick: success })(Share);

export default createPlugin('Share', {
    component: withRouter(SharePlugin)
});
