// @ts-nocheck
import React from "react";
import {ThemedMarkdown} from "../../components/markdown/ThemedMarkdown";

export class CookieDefaultComponents{

  static getCookieComponentConsent(){
    return <ThemedMarkdown markdown={`
### Wir brauchen deine Zustimmung

Wir verwenden Cookies, um Inhalte und Anzeigen zu personalisieren, Funktionen für soziale Medien anbieten zu können und die Zugriffe auf unsere Website/App zu analysieren. Außerdem geben wir Informationen zu Ihrer Verwendung unserer Website/App an unsere Partner für soziale Medien, Werbung und Analysen weiter. Unsere Partner führen diese Informationen möglicherweise mit weiteren Daten zusammen, die Sie ihnen bereitgestellt haben oder die sie im Rahmen Ihrer Nutzung der Dienste gesammelt haben.
    `}>
    </ThemedMarkdown>
  }


  static getCookieComponentAbout(){
    return <ThemedMarkdown>
      {`
Cookies sind kleine Textdateien, die von Webseiten verwendet werden, um die Benutzererfahrung effizienter zu gestalten.

Laut Gesetz können wir Cookies auf deinem Gerät speichern, wenn diese für den Betrieb dieser Seite unbedingt notwendig sind. Für alle anderen Cookie-Typen benötigen wir deine Erlaubnis.

Diese Seite verwendet unterschiedliche Cookie-Typen. Einige Cookies werden von Drittparteien platziert, die auf unseren Seiten erscheinen.

Du kannst deine Einwilligung jederzeit von der Cookie-Erklärung auf unserer Website ändern oder widerrufen.

Erfahre in unserer Datenschutzrichtlinie mehr darüber, wer wir sind, wie du uns kontaktieren kannst und wie wir personenbezogene Daten verarbeiten.
    `}
    </ThemedMarkdown>
  }

}
