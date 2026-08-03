// Hinweis: Neue SettingsList-Komponenten bitte in der Playbook-Registry (packages/common-ui/src/playbook) registrieren.
import React from 'react';
import { SettingsListEditable as CommonSettingsListEditable } from 'repo-depkit-common-ui';
import type { SettingsListEditableProps } from 'repo-depkit-common-ui';

export type { SettingsListEditableProps };

const SettingsListEditable: React.FC<SettingsListEditableProps> = (props) => {
	return <CommonSettingsListEditable {...props} />;
};

export default SettingsListEditable;

