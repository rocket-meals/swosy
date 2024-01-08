// @ts-nocheck
import React from "react";

export class CloneChildrenWithProps{

    static passProps(children, props){
        const childrenWithProps = React.Children.map(children, child => {
            // Checking isValidElement is the safe way and avoids a typescript
            // error too.
            if (React.isValidElement(child)) {
                return React.cloneElement(child, props);
            }
            return child;
        });
        return childrenWithProps
    }

}