// @ts-nocheck
import {FunctionComponent} from 'react';

export class RouteLink{
  component: FunctionComponent;
  template: FunctionComponent;
  title: string;
  route: string;
  params: any;

  constructor(component, template=null, title, route, params=null) {
    this.component = component;
    this.template = template;
    this.title = title;
    this.route = route;
    this.params = params;
  }
}
