/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';
import {
    CUSTOM_ZOOM_TO,
    zoomTo
} from '../mapviewer';

describe('mapviewer actions', () => {
    it('zoomTo', () => {
        const extent = [-180, -90, 180, 90];
        const retVal = zoomTo(extent);
        expect(retVal).toExist();
        expect(retVal.type).toBe(CUSTOM_ZOOM_TO);
        expect(retVal.extent).toEqual(extent);
    });
});
