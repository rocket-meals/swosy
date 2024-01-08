import React, {FunctionComponent} from "react";
import {Box} from "native-base";
import {BreakPointLayout} from "./BreakPointLayout";
import {Layout} from "./Layout";
import {CloneChildrenWithProps} from "../helper/CloneChildrenWithProps";
import {BaseNoScrollTemplate, BaseNoScrollTemplateProps} from "./BaseNoScrollTemplate";
import {ScrollViewWithGradient} from "../utils/ScrollViewWithGradient";

export interface BaseNoPaddingTemplateProps extends BaseNoScrollTemplateProps{

}

const BaseNoPaddingTemplate: FunctionComponent<BaseNoPaddingTemplateProps> = React.memo(({
                                                                                           children,
                                                                                           title,
                                                                                           header,
                                                                                           _status,
                                                                                           _hStack,
                                                                                           ...props
                                                                                         }: any) => {

  const childrenWithProps = CloneChildrenWithProps.passProps(children, {...props});

  return(
    <BaseNoScrollTemplate {...props} title={title} header={header}>
      <ScrollViewWithGradient hideGradient={true} style={{width: "100%", height: "100%"}} >
        <BreakPointLayout >
          <Box style={{height: "100%", alignItems: "flex-start", width: "100%"}}>
            {childrenWithProps}
          </Box>
        </BreakPointLayout>
      </ScrollViewWithGradient>
    </BaseNoScrollTemplate>
  )
});

(BaseNoPaddingTemplate as any).useBaseTemplateContentWidth = Layout.useBaseTemplateContentWidth;


export { BaseNoPaddingTemplate };
