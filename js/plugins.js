/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import BackgroundSelectorPlugin from '@mapstore/plugins/BackgroundSelector';
import NotificationsPlugin from '@mapstore/plugins/Notifications';
import SearchPlugin from '@mapstore/plugins/Search';
import ToolbarPlugin from '@mapstore/plugins/Toolbar';
import ZoomInPlugin from '@mapstore/plugins/ZoomIn';
import ZoomOutPlugin from '@mapstore/plugins/ZoomOut';

import DashboardLayoutPlugin from '@js/plugins/DashboardLayout';
import FullScreenPlugin from '@js/plugins/FullScreen';
import MapViewerPlugin from '@js/plugins/MapViewer';
import RefreshPlugin from '@js/plugins/Refresh';
import SharePlugin from '@js/plugins/Share';
import TutorialPlugin from '@js/plugins/Tutorial';
import ZoomAllPlugin from '@js/plugins/ZoomAll';

export const plugins = {
    BackgroundSelectorPlugin,
    NotificationsPlugin,
    SearchPlugin,
    ToolbarPlugin,
    ZoomInPlugin,
    ZoomOutPlugin,

    DashboardLayoutPlugin,
    FullScreenPlugin,
    MapViewerPlugin,
    RefreshPlugin,
    SharePlugin,
    TutorialPlugin,
    ZoomAllPlugin
};

export const requires = {};

export default {
    plugins,
    requires
};
