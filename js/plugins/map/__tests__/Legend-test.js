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
import Legend from '../Legend';

describe('Legend component', () => {
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
        ReactDOM.render(<Legend/>, document.getElementById("container"));
        const container = document.getElementById('container');
        const legendNode = container.querySelector('.legend');
        expect(legendNode).toBeTruthy();
    });
    it('should render with simple configuration', () => {
        ReactDOM.render(<Legend
            domain={{min: 0, max: 400000}}
            range={[2, 50]}
            classes={4}
            properties={['totalTestResults', 'positive']}
            colors={{ totalTestResults: 'rgb(73, 185, 255)', positive: 'rgb(255, 51, 170)' }}
        />, document.getElementById("container"));
        const container = document.getElementById('container');
        const legendNode = container.querySelector('.legend');
        expect(legendNode).toBeTruthy();
        const circles = legendNode.querySelectorAll('circle');
        expect(circles.length).toBe(4);
        const texts = legendNode.querySelectorAll('text');
        expect(texts.length).toBe(4);
        expect([...texts].map(text => text.innerHTML)).toEqual([ '400k', '300k', '200k', '100k' ]);

        const swatches = legendNode.querySelectorAll('li > div');
        expect(swatches.length).toBe(2);
        expect([...swatches].map(swatch => swatch.style.backgroundColor)).toEqual([ 'rgb(73, 185, 255)', 'rgb(255, 51, 170)' ]);
    });
});
