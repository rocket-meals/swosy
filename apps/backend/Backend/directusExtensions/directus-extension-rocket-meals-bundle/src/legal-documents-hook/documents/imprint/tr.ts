import type { LegalDocumentText } from '../../LegalDocuments';

export const IMPRINT_TR: LegalDocumentText = {
  title: 'Hakkımızda',
  content: `# Künye

Aşağıdaki bilgiler, sağlayıcı etiketlemesine ilişkin yasal olarak gerekli bilgilerin yanı sıra web sitesi ve uygulamaya ilişkin yasal bilgileri içerir.

## Yayıncı:
	
	{{operator.name}}
	{{operator.street}},
	{{operator.postal_code}} {{operator.city}}
	Telefon: {{operator.phone}}
	E-posta: {{operator.email}}
	Genel Müdür: {{operator.managing_director}}
	Vergi numarası: {{operator.tax_number}}
	Satış vergisi kimlik numarası: {{operator.vat_id}}
	Ticaret sicili: Amtsgericht {{operator.register_court}}, {{operator.register_number}}
	
	E-Mail:

	[{{operator.email}}](mailto:{{operator.email}})

	Web sitesi:

	[{{operator.website}}]({{operator.website}})

## İletişim seçenekleri
	Bizimle e-posta yoluyla veya web sitemiz üzerinden iletişime geçebilirsin.

	E-posta:

	[{{operator.email}}](mailto:{{operator.email}})

	Web sitesi:

	[{{operator.website}}]({{operator.website}})

## Tasarım ve teknik gerçekleştirme
	{{operator.name}}
	
	[{{operator.email}}](mailto:{{operator.email}})
	
	[{{operator.website}}]({{operator.website}})


## Gazetecilik-editörlük içeriğinden sorumludur:

	{{customer.name}}
	{{customer.legal_form}}
	Tel. {{customer.phone}}

	[{{customer.email}}](mailto:{{customer.email}})

    Studierendenwerk, görsellerin, yemeklerin, gıda tekliflerinin, etiketlemenin ve alerjenlere ilişkin simgelerin yanı sıra etiketlemenin sağlanmasından sorumludur. Aynı zamanda daireler ve haberler için bilgi ve görüntü haklarından da sorumludur.


## Yasal Uyarı

	### Çevrimiçi teklifin içeriği

		Bu uygulamanın ve web sitesinin operatörü olarak {{operator.short_name}}, sağlanan bilgilerin güncelliği, doğruluğu, eksiksizliği veya kalitesi konusunda hiçbir sorumluluk kabul etmez. {{operator.short_name}}'e karşı, sağlanan bilgilerin kullanılması veya kullanılmaması ya da yanlış veya eksik bilgilerin kullanılmasından kaynaklanan maddi veya manevi zararlarla ilgili sorumluluk talepleri, {{operator.short_name}}'in kasıtlı veya ağır ihmalle hareket ettiği kanıtlanmadıkça, temelde hariç tutulur. Tüm teklifler değişikliğe tabidir ve bağlayıcı değildir. {{operator.short_name}}, önceden haber vermeksizin sayfaların bazı bölümlerini veya teklifin tamamını değiştirme, tamamlama veya silme ya da yayını geçici veya kalıcı olarak durdurma hakkını açıkça saklı tutar.

	### Çeviriler

		Yemek planları, yemek açıklamaları ve haberler gibi içerikler Almanca hazırlanır. Diğer dillere yapılan çeviriler kısmen otomatik olarak oluşturulur ve bir hizmet olarak sunulur. Çeviri hataları bu nedenle göz ardı edilemez. Bağlayıcı olan Almanca versiyondur. Bu durum özellikle alerjenler ve katkı maddelerine ilişkin bilgiler için geçerlidir.

	### Referanslar ve bağlantılar

		İşletmecinin sorumluluk alanı dışında kalan harici web sitelerine ("bağlantılar") doğrudan veya dolaylı referanslar söz konusu olduğunda, bir sorumluluk yükümlülüğü yalnızca işletmecinin içerikten haberdar olması ve yasa dışı içerik durumunda kullanımı engellemesinin teknik olarak mümkün ve makul olması durumunda yürürlüğe girecektir.

		Bu nedenle {{operator.short_name}}, bağlantıların oluşturulduğu tarihte bağlantılı sayfaların yasa dışı içerikten arındırılmış olduğunu açıkça beyan eder. İşletmecinin, bağlantılı sayfaların mevcut ve gelecekteki tasarımı ve içeriği üzerinde hiçbir etkisi yoktur. Bu nedenle, operatör, bağlantı oluşturulduktan sonra değiştirilen tüm bağlantılı sayfaların tüm içeriğinden açıkça uzak durur. Bu beyan, {{operator.short_name}}'in kendi web sitesinde yer alan tüm bağlantılar ve referansların yanı sıra {{operator.short_name}} tarafından oluşturulan ziyaretçi defterleri, tartışma forumları ve posta listelerindeki üçüncü taraf girişleri için de geçerlidir. Yasadışı, yanlış veya eksik içeriklerden ve özellikle bu tür bilgilerin kullanılmasından veya kullanılmamasından kaynaklanan zararlardan, ilgili yayına yalnızca bağlantılar aracılığıyla atıfta bulunan kişi değil, yalnızca atıfta bulunulan sayfanın sağlayıcısı sorumludur.

	### Telif hakkı ve etiketleme kanunu

		Uygulamanın ve ana sayfanın düzeni, kullanılan grafikler ve diğer içerikler telif hakkı ile korunmaktadır. Bilgi ve verilerin çoğaltılması, özellikle metinlerin veya resimlerin bazı bölümlerinin kullanılması, {{operator.short_name}}'in önceden yazılı onayını gerektirir. Kullanıcı, içeriği yalnızca sunulan işlevler kapsamında kişisel kullanımı için kullanabilir. İçerik veya programlar üzerinde herhangi bir hak elde etmez. Yazılımın indirilmek üzere sunulması halinde, kullanıcının kullanım yetkisi web sitesinin kullanımı kapsamında kişisel kullanımla sınırlıdır.

		{{operator.short_name}}, tüm yayınlarda kullanılan grafiklerin, ses belgelerinin, video dizilerinin ve metinlerin telif haklarını gözetmeye, kendi oluşturduğu grafikleri, ses belgelerini, video dizilerini ve metinleri kullanmaya veya lisanssız grafiklerden, ses belgelerinden, video dizilerinden ve metinlerden yararlanmaya gayret eder. Web sitesinde adı geçen ve muhtemelen üçüncü şahıslar tarafından korunan tüm marka ve ticari markalar, herhangi bir kısıtlama olmaksızın yürürlükteki ticari marka kanunu hükümlerine ve ilgili tescilli sahiplerinin mülkiyet haklarına tabidir. Bir ticari markadan yalnızca bahsedilmesi, üçüncü taraf haklarıyla korunmadığı anlamına gelmez! Operatörün kendisi tarafından oluşturulan yayınlanmış nesnelerin telif hakkı yalnızca sayfaların operatörüne aittir. Bu tür grafiklerin, ses belgelerinin, video dizilerinin ve metinlerin diğer elektronik veya basılı yayınlarda çoğaltılmasına veya kullanılmasına operatörün açık izni olmadan izin verilmez.
		
		
	### Veri koruma

		Uygulama ve web sitesi kişisel veya ticari verileri (e-posta adresleri, isimler, adresler) girme imkanı sunuyorsa, bu verilerin kullanıcı tarafından ifşa edilmesi açıkça isteğe bağlıdır. Sunulan tüm hizmetlerin kullanımına ve bu hizmetler için ödeme yapılmasına - teknik olarak mümkün ve makul olduğu ölçüde - bu tür veriler sağlanmadan veya anonimleştirilmiş veriler veya takma ad sağlanarak da izin verilir.
		
		
	### Bu feragatnamenin yasal geçerliliği

		Bu beyanın bölümleri veya münferit şartları yasal veya doğru değilse, diğer bölümlerin içeriği veya geçerliliği bu durumdan etkilenmez.`,
};
