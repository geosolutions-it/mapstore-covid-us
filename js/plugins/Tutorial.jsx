/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import { TutorialPlugin, reducers, epics } from '@mapstore/plugins/Tutorial';
import { createPlugin } from '@mapstore/utils/PluginsUtils';

// remove default epic to manage steps
const { switchTutorialEpic, ...tutorialEpics } = epics || {};

export default createPlugin('Tutorial', {
    component: TutorialPlugin,
    reducers,
    epics: {
        ...tutorialEpics
    }
});
