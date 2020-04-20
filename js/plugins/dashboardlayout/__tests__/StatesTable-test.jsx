/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import ReactDOM from 'react-dom';
import expect from 'expect';
import StatesTable from '../StatesTable';

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
    it('should render with default', () => {
        ReactDOM.render(<StatesTable/>, document.getElementById("container"));
        const container = document.getElementById('container');
        const statesTableNode = container.querySelector('.states-table');
        expect(statesTableNode).toBeTruthy();
    });

    it('should render with states data', () => {
        ReactDOM.render(
            <StatesTable
                data={[
                    {
                        state: 'AK',
                        dateModified: '2020-04-18T21:45:00Z',
                        totalTestResults: 9895,
                        positive: 319,
                        negative: 9576,
                        death: 9,
                        recovered: 153,
                        hospitalizedCurrently: 37,
                        inIcuCurrently: null,
                        onVentilatorCurrently: null
                    }
                ]}
                info={{
                    state: 'AK',
                    name: 'Alaska'
                }}
                properties={['totalTestResults', 'positive']}
                colors={{
                    total: '#0000ff',
                    positive: '#ff0000'
                }}
                range={{
                    min: 0,
                    max: 374769
                }}
                idProperty="state"
                stateLabelProperty="name"
            />, document.getElementById("container"));
        const container = document.getElementById('container');
        const statesTableNode = container.querySelector('.states-table');
        expect(statesTableNode).toBeTruthy();
        const theadColNodes = statesTableNode.querySelectorAll('thead th');
        expect(theadColNodes.length).toBe(4);
        const tbodyRowNodes = statesTableNode.querySelectorAll('tbody tr');
        expect(tbodyRowNodes.length).toBe(1);
    });
});
