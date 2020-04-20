/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

export const CUSTOM_ZOOM_TO = 'CUSTOM:ZOOM_TO';
export const zoomTo = (extent, options) => ({
    type: CUSTOM_ZOOM_TO,
    extent,
    options
});
