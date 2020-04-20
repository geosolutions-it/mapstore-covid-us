/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import HTML from '@mapstore/components/I18N/HTML';
import numeral from 'numeral';
import moment from 'moment';
import 'moment-timezone';

function LiveText({
    date,
    confirmed,
    deaths
}) {

    const zoneName = moment.tz.guess();
    const timezone = moment.tz(zoneName).zoneAbbr();

    return (date && confirmed && deaths)
        ? (
            <div
                id="live-text"
                className="live-text">
                <HTML
                    msgId="customMessages.liveText"
                    msgParams={{
                        date: moment(date).format(`h:mm a [${timezone}], Do MMMM YYYY`),
                        confirmed: numeral(confirmed).format('0,0'),
                        deaths: numeral(deaths).format('0,0')
                    }}
                />
                <small><HTML msgId="customMessages.requestDateMessage" /></small>
            </div>
        )
        : null;
}

export default LiveText;
