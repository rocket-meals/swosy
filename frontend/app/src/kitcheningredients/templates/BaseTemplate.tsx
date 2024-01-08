import React, {FunctionComponent} from "react";
import {Layout} from "./Layout";
import {CloneChildrenWithProps} from "../helper/CloneChildrenWithProps";
import {BaseNoPaddingTemplate, BaseNoPaddingTemplateProps} from "./BaseNoPaddingTemplate";
import {BasePadding} from "./BasePadding";

export interface BaseTemplateProps extends BaseNoPaddingTemplateProps{

}

const BaseTemplate: FunctionComponent<BaseTemplateProps> = React.memo(({
                                                                         children,
                                                                         title,
                                                                         header,
                                                                         _status,
                                                                         _hStack,
                                                                         ...props
                                                                       }: any) => {

  /**
  const [rendered, setRendered] = useState([]);

  useEffect(() => {
    setTimeout(() => {
      const childrenWithProps = CloneChildrenWithProps.passProps(children, {...props});
      setRendered(childrenWithProps);
    }, 0)
  }, []);
  */

  const childrenWithProps = CloneChildrenWithProps.passProps(children, {...props});
  const rendered = childrenWithProps;


  return(
    <BaseNoPaddingTemplate {...props} title={title} header={header}>
      <BasePadding>
        {rendered}
      </BasePadding>
    </BaseNoPaddingTemplate>
  )
});

(BaseTemplate as any).useBaseTemplateContentWidth = Layout.useBaseTemplateContentWidth;

export { BaseTemplate };
