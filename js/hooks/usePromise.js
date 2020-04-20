/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useEffect, useState, useRef } from 'react';

const usePromise = ({
    watch = [],
    promiseFn = () => new Promise(),
    needsUpdate = () => true,
    onResolve = () => {},
    onReject = () => {}
}) => {
    const cancelled = useRef();
    const counter = useRef(0);
    let cancelToken;
    const [state, setState] = useState({});
    const handlePending = (pending) => {
        if (!cancelled.current) {
            setState({ pending });
        }
    };
    const handleResolve = (response, count) => {
        if (!cancelled.current && count === counter.current) {
            setState({ response });
            onResolve(response);
            handlePending(false);
        }
    };
    const handleReject = (error, count) => {
        if (!cancelled.current && count === counter.current) {
            setState({ error });
            onReject(error);
            handlePending(false);
        }
    };
    useEffect(() => {
        if (needsUpdate()) {
            cancelled.current = false;
            counter.current++;
            let count = counter.current;
            if (cancelToken) { cancelToken(); }
            cancelToken = undefined;
            handlePending(true);
            promiseFn((c) => { cancelToken = c; })
                .then((response) => handleResolve(response, count))
                .then((error) => handleReject(error, count));
        }
        return () => {
            cancelled.current = true;
            if (cancelToken) { cancelToken(); }
        };
    }, watch);
    return state;
};

export default usePromise;
