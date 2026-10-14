import type { LegalDocumentText } from '../../LegalDocumentTypes';

export const IMPRINT_ZH: LegalDocumentText = {
  title: '关于我们',
  content: `# 版本说明

以下信息包含法律规定的供应商标签信息以及网站和应用程序的法律信息。

## 出版商：
	
	{{operator.name}}
	{{operator.street}}、
	{{operator.postal_code}} {{operator.city}}
	电话: {{operator.phone}}
	电子邮件： {{operator.email}}
	总经理：{{operator.managing_director}}
	税号：{{operator.tax_number}}
	营业税识别号：{{operator.vat_id}}
	
	电子邮件

	[{{operator.email}}](mailto:{{operator.email}})

	网站

	[{{operator.website}}]({{operator.website}})

## 联系方式
	您可以通过电子邮件或网站与我们联系。

	电子邮件：

	[{{operator.email}}](mailto:{{operator.email}})

	网站

	[{{operator.website}}]({{operator.website}})

## 设计和技术实现
	{{operator.name}}
	
	[{{operator.email}}](mailto:{{operator.email}})
	
	[{{operator.website}}]({{operator.website}})


## 负责新闻编辑内容：

	{{customer.name}}
	{{customer.legal_form}}
	电话 {{customer.phone}}

	[{{customer.email}}](mailto:{{customer.email}})

    Studierendenwerk 负责提供图片、膳食、食品供应、标签和过敏原图标以及标签。它还负责提供单位和新闻的信息和图片版权。


## 免责声明

	### 在线报价内容

		{{operator.short_name}} 作为本应用程序和网站的运营商，不对所提供信息的时事性、正确性、完整性或质量承担任何责任。因使用或不使用所提供的信息，或因使用不正确或不完整的信息而造成的物质或非物质损失，{{operator.short_name}} 公司不承担任何责任，除非 {{operator.short_name}} 公司被证明有故意或重大过失。所有报价均可更改，不具有约束力。{{operator.short_name}} 明确保留在不事先通知的情况下更改、补充或删除部分页面或整个报价的权利，或暂时或永久停止发布的权利。

	### 参考资料和链接

		在直接或间接引用经营者责任范围之外的外部网站（"链接"）的情况下，只有在经营者知晓其内容并且在技术上可能且合理地阻止使用非法内容的情况下，责任义务才会生效。

		因此，{{operator.short_name}}明确声明，在创建链接时，所链接的网页没有非法内容。经营者对链接网页当前和未来的设计和内容没有任何影响。因此，经营者在此明确声明，其与所有链接网页中在链接创建后被更改的内容无关。本声明适用于 {{operator.short_name}}自己网站上的所有链接和参考资料，也适用于 {{operator.short_name}}建立的留言簿、论坛和邮件列表中的第三方条目。对于非法、不正确或不完整的内容，特别是由于使用或不使用这些信息而造成的损失，只有所引用网页的提供者承担责任，而不是仅通过链接引用相关出版物的人。

	### 版权和标签法

		应用程序和主页的布局、使用的图形和其他内容受版权保护。复制信息和数据，特别是使用部分文字或图片，必须事先获得 {{operator.short_name}} 公司的书面同意。用户只能在所提供的功能范围内将内容用于个人用途。用户对内容或程序不享有任何权利。如果提供软件下载，用户的使用授权仅限于在网站使用范围内的个人使用。

		{{operator.short_name}}努力遵守所有出版物中使用的图形、声音文件、视频序列和文本的版权，使用自己制作的图形、声音文件、视频序列和文本，或使用免许可证的图形、声音文件、视频序列和文本。网站上提及的可能受第三方保护的所有品牌和商标均不受限于适用的商标法规定和各自注册所有人的所有权。仅提及商标并不意味着该商标不受第三方权利的保护！由经营者自己创建的发布对象的版权完全归网页经营者所有。未经经营者明确同意，不得在其他电子或印刷出版物中复制或使用这些图形、声音文件、视频序列和文本。
		
		
	### 数据保护

		如果应用程序和网站提供输入个人或商业数据（电子邮件地址、姓名、地址）的可能性，则用户明确表示自愿披露这些数据。在技术可行和合理的情况下，用户也可以在不提供此类数据或提供匿名数据或假名的情况下使用所提供的所有服务并支付费用。
		
		
	### 本免责声明的法律效力

		如果本声明的部分或个别条款不合法或不正确，其他部分的内容或有效性不受此影响。`,
};
