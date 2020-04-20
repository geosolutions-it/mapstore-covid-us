/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import ReactDOM from 'react-dom';
import ReactTestUtils from 'react-dom/test-utils';

import expect from 'expect';
import TotalsCounter from '../TotalsCounter';

describe('TotalsCounter component', () => {
    beforeEach((done) => {
        document.body.innerHTML = '<div id="container"></div>';
        setTimeout(done);
    });
    afterEach((done) => {
        ReactDOM.unmountComponentAtNode(document.getElementById("container"));
        document.body.innerHTML = '';
        setTimeout(done);
    });
    it('should render with data', () => {
        ReactDOM.render(
            <TotalsCounter
                data={{
                    total: 500000,
                    positive: 10000
                }}
            />, document.getElementById("container"));
        const container = document.getElementById('container');
        const counter = container.querySelectorAll('.counter');
        expect(counter.length).toBe(2);
    });
    it('should return selected property key', (done) => {
        ReactDOM.render(
            <TotalsCounter
                selectEnabled
                data={{
                    total: 500000,
                    positive: 10000
                }}
                onSelect={(selectedKey) => {
                    expect(selectedKey).toBe('total');
                    done();
                }}
            />, document.getElementById("container"));
        const container = document.getElementById('container');
        const counter = container.querySelectorAll('.counter');
        expect(counter.length).toBe(2);
        ReactTestUtils.Simulate.click(counter[0]);
    });
});
