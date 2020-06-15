/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import isNumber from 'lodash/isNumber';
import Message from '@mapstore/components/I18N/Message';
import usePromise from '@js/hooks/usePromise';
import axios from '@mapstore/libs/ajax';
import { Area, AreaChart, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, CartesianGrid } from 'recharts';
import { getMessageById } from '@mapstore/utils/LocaleUtils';
import moment from 'moment';
import numeral from 'numeral';
import Loader from '@mapstore/components/misc/Loader';
import { Button as ButtonRB, Glyphicon } from 'react-bootstrap';
import tooltip from '@mapstore/components/misc/enhancers/tooltip';
import { getConfigProp } from '@mapstore/utils/ConfigUtils';
import exitFullscreen from '../../../themes/default/svg/exit-full-screen-p.svg';

const Button = tooltip(ButtonRB);
const CancelToken = axios.CancelToken;

const Chart = ({
    info,
    properties = [],
    colors = {},
    selected,
    endpoint = {}
}, { messages }) => {
    const [ data, setData ] = useState([]);
    const [count, setCount  ] = useState([]);
    const { pending } = usePromise({
        promiseFn: (cancelToken) => {
            const url = selected
                ? endpoint?.dailyState?.url?.replace?.(/\{state\}/g, selected.toLowerCase())
                : endpoint?.daily?.url;
            return axios.get(url, {
                cancelToken: new CancelToken(function executor(cancel) {
                    cancelToken(cancel);
                })
            });
        },
        onResolve: (response, newCount) => {
            setCount(newCount);
            setData([...response?.data].sort((a, b) => a.date > b.date ? 1 : -1));
        },
        watch: [ selected ]
    });

    const zoneName = moment.tz.guess();
    const timezone = moment.tz(zoneName).zoneAbbr();

    return (
        <div
            style={{
                position: 'relative',
                width: '100%',
                height: '100%'
            }}
        >
            <ResponsiveContainer
                width="100%"
                height="100%"
            >
                <AreaChart
                    key={`chart-${count}-${JSON.stringify(properties)}`}
                    data={[ ...data ]}
                    margin={{ top: 15, right: 15, bottom: 15, left: 5 }}
                >
                    <CartesianGrid stroke="#eee"/>
                    <XAxis
                        dataKey="dateChecked"
                        tickFormatter={(value) => moment(value).format('MM[/]DD')}
                        label={({x, y, width: w, height: h}) => {
                            return (
                                <text
                                    x={x + w / 2}
                                    y={y + h}
                                    fill="#333333"
                                    alignmentBaseline="baseline"
                                    textAnchor="middle"
                                    fontSize={11}
                                >
                                    {getMessageById(messages, 'customMessages.dateChecked')}
                                </text>
                            );
                        }}
                        tick={{
                            dy: 4,
                            fontSize: 10,
                            textAnchor: 'middle'
                        }}
                    />
                    <YAxis
                        label={({x, y, height: h}) => {
                            return (
                                <text
                                    x={x}
                                    y={y + h / 2}
                                    fill="#333333"
                                    alignmentBaseline="hanging"
                                    textAnchor="middle"
                                    fontSize={11}
                                    transform={`rotate(-90, ${x}, ${y + h / 2})`}
                                >
                                    {getMessageById(messages, 'customMessages.count')}
                                </text>
                            );
                        }}
                        tickFormatter={(value) => numeral(value).format('0a')}
                        type="number"
                        tick={{
                            dx: -4,
                            fontSize: 10,
                            textAnchor: 'end',
                            alignmentBaseline: 'middle'
                        }}
                    />
                    <Tooltip
                        content={({ payload, label: date }) => {
                            return (
                                <div
                                    className="shadow-far"
                                    style={{
                                        backgroundColor: '#fff',
                                        padding: 8,
                                        maxWidth: 256
                                    }}
                                >
                                    <div><strong>{info?.[selected]?.name || <Message msgId={`customMessages.stateLabel`}/>}</strong></div>
                                    <table>
                                        {[
                                            {
                                                dataKey: 'dateChecked',
                                                value: date
                                            },
                                            ...payload
                                        ].map(({ value, dataKey, color }) => {
                                            const borderStyle = color && { borderBottom: `1px solid ${color}` };
                                            return (
                                                <tr key={dataKey} style={{ fontSize: 10, wordBreak: 'break-word', ...borderStyle }}>
                                                    <td>{<Message msgId={`customMessages.${dataKey}`}/>}</td>
                                                    <td style={{ textAlign: 'right', marginLeft: 8 }}>{
                                                        isNumber(value)
                                                            ? numeral(value).format('0,0')
                                                            : moment(value).isValid()
                                                                ? moment(value).format(`h:mm a [${timezone}], Do MMMM YYYY`)
                                                                : value}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </table>
                                </div>
                            );
                        }}
                    />
                    <Legend
                        fontSize="10"
                        verticalAlign="top"
                        height={21}
                        iconType="rect"
                        formatter={(value) => <Message msgId={`customMessages.${value}`}/>}
                    />
                    {properties.map(property => {
                        return (
                            <Area
                                key={`${property}-${count}`}
                                type="monotone"
                                isAnimationActive={false}
                                dataKey={property}
                                fill={colors[property]}
                                stroke={colors[property]}
                                fillOpacity={0.1}
                            />);
                    })}
                </AreaChart>
            </ResponsiveContainer>
            {pending && <div
                style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    top: 0,
                    left: 0,
                    backgroundColor: 'rgba(255, 255, 255, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                <Loader size={70} />
            </div>}
        </div>
    );
};

Chart.contextTypes = {
    messages: PropTypes.object
};

const ExpandableChart = ({
    stateLabelProperty,
    containerNode = document.querySelector('.' + (getConfigProp('themePrefix') || 'ms2') + " > div") || document.body,
    ...props
}) => {

    const [ expand, setExpand ] = useState(false);
    const chart = (
        <div
            id="date-count-chart"
            className="date-count-chart">
            <div className="chart-info-container">
                <div className="placeholder"></div>
                <div className="chart-info">
                    {props.info?.[props?.selected]?.[stateLabelProperty]
                        ? <Message msgId="customMessages.chartDataLabelSelected" msgParams={{ label: props.info?.[props?.selected]?.[stateLabelProperty] }}/>
                        : <Message msgId="customMessages.chartDataLabel"/>}
                </div>
                <Button
                    tooltipId={expand ? 'fullscreen.tooltipDeactivate' : 'fullscreen.tooltipActivate'}
                    tooltipPosition="top"
                    className="square-button-md"
                    onClick={() => setExpand(!expand)}>
                    {expand
                        ? <img src={exitFullscreen} width={20} height="auto"/>
                        : <Glyphicon glyph="1-full-screen"/>}
                </Button>
            </div>
            <div className="chart-container">
                <div>
                    <Chart { ...props} />
                </div>
            </div>
        </div>
    );
    return expand
        ? createPortal(
            <div
                className="chart-expanded"
                style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    top: 0,
                    left: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.5em'
                }}>
                {chart}
            </div>,
            containerNode
        )
        : chart;
};

export default ExpandableChart;
