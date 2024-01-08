// @ts-nocheck
import React from 'react';

export class NavigationQueueItem{
    routeName: string;
    props: any;
    resetHistory?: boolean;

    constructor(routeName, props, resetHistory=false) {
        this.routeName = routeName;
        this.props = props;
        this.resetHistory = resetHistory;
    }

}