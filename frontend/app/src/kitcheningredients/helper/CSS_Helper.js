import CSSOM from "cssom";

export class CSS_Helper{

    static parseCssToSelectorMap(custom_css) {
        let ast = CSSOM.parse(custom_css)

        let selectorsMap = {};

//        value = value.replaceAll(" !important", "");
        let rules = ast?.cssRules || [];
        for(let rule of rules){
            /**
             * Example parse
             selectorText: ".sso-icon"
             style: CSSStyleDeclaration{
                 0: "background"
                 background: "#AC0634"
                 length: 1
                 parentRule: CSSStyleRule {parentRule: null, parentStyleSheet: CSSStyleSheet, selectorText: '.sso-icon', style: CSSStyleDeclaration, __starts: 0, …}
                 __starts: 10
                 _importants: {background: 'important'}
                 cssText: "background: #AC0634 !important;"
             }
             */
            let selectorText = rule.selectorText;
            let style = rule.style;
            let styleForSelectorText = {};

            let lengthRaw = style.length || "0";
            let length = parseInt(lengthRaw);
            for(let i=0; i<length; i++){
                let selectorProperty = style[i+""];
                let selectorValue = style[selectorProperty];
                styleForSelectorText[selectorProperty] = selectorValue;
            }

            selectorsMap[selectorText] = styleForSelectorText
        }

        return selectorsMap;
    }

}