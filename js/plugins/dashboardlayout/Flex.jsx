/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { forwardRef } from 'react';

const Flex = forwardRef(({ id, className, flex, direction = 'column', children, fit, overflow }, ref) => {
    return (
        <div
            id={id}
            className={className}
            ref={ref}
            style={{
                display: 'flex',
                flexDirection: direction,
                flex,
                position: 'relative',
                ...(overflow && { overflow: 'auto' }),
                ...(fit && { width: '100%', height: '100%' })
            }}>
            {children}
        </div>
    );
});

export default Flex;
