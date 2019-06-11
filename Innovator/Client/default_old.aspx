<!DOCTYPE html>
<%
	Dim salt As String = String.Empty
	Dim clientConfig As ClientConfig = ClientConfig.GetServerConfig()
	If clientConfig.UseCachingModule Then
		salt = ClientHttpApplication.FullSaltForCachedContent + "/"
	End If
%>
<html>
	<head>
		<base href="<%=salt%>scripts/" ></base>
		<link rel="stylesheet" href="../styles/common.min.css"/>
		<link rel="stylesheet" href="../styles/main.min.css"/>
		<link rel="stylesheet" href="../javascript/include.aspx?classes=common.css">
		<link rel="preload" href="../styles/fontsNotoJp.css" as="style" onload="this.onload=null;this.rel='stylesheet'"/>
		<link rel="preload" href="../styles/fontsRobotoLt.css" as="style" onload="this.onload=null;this.rel='stylesheet'"/>
		<style>
			body {
				overflow: hidden;
			}
			/* disable default outline for focused element in Chrome */
			@supports (-webkit-appearance:none) {
				*:focus {
					outline: none
				}
			}
			.main {
				position: absolute;
				width: 100%;
				height: 100%;
			}
		</style>
		<!-- #INCLUDE FILE="scripts/include/InitialSetupHeader.aspx" -->
		<link rel="icon" sizes="16x16 32x32 48x48 64x64 144x144" href="<%=requestDir%>/images/favicon.ico" />
		<script type="text/javascript">
			var browserInfo;
			try {
				browserInfo = new BrowserInfo();
				if (!browserInfo.isKnown() || !browserInfo.isSupported()) {
					//we even cannot recognize this browser
					location = "<%=requestDir%>/SupportedBrowsers.html";
				}
			}
			catch (excep) {
				//Everything is so bad that we even cannot instantiate BrowserInfo and check if browser is supported or not.
				location = "<%=requestDir%>/SupportedBrowsers.html";
			}
		</script>
		<script src="../jsBundles/cui.js"></script>
		<script src="../jsBundles/startup.js"></script>
		<script type="text/javascript">
		//Require 'Aras/Client/Controls/Experimental/TimeZoneInfo' need for pre-caching for TimeZonesInformation.js
		require(
			[
				'dojo/date/locale',
				'Aras/Client/Controls/Experimental/TimeZoneInfo'
			]
		);

		onbeforeunload = function() {
			if (aras.getCommonPropertyValue('exitInProgress') === true) {
				return;
			}

			if (aras.isDirtyItems()) {
				window.onLogoutCommand();
				var rm = new ResourceManager(new Solution('core'), 'ui_resources.xml', aras.getSessionContextLanguageCode());
				return rm.getString('setup.beforeunload_warning');
			} else if (
				window.arasTabs && document.querySelector('.aras-tabs .aras-tabs_active') &&
				aras.getCommonPropertyValue('exitWithoutSavingInProgress') !== true
			) {
				var rm = new ResourceManager(new Solution('core'), 'ui_resources.xml', aras.getSessionContextLanguageCode());
				return rm.getString('setup.tab_close_warning');
			}
		};

		function initLoginFrame() {
			const tzLabel = aras.browserHelper.tzInfo.getTimeZoneLabel();
			const winTzName = aras.browserHelper.tzInfo.getTimeZoneNameFromLocalStorage(tzLabel);

			if(winTzName) {
				aras.setCommonPropertyValue("systemInfo_CurrentTimeZoneName", winTzName);
				login();
			} else {
				const winTzNames = aras.browserHelper.tzInfo.getWindowsTimeZoneNames(tzLabel);

				if (winTzNames.length === 0) {
					aras.AlertError(aras.getResource("", "tz.get_currentzone_fail"));
				} else if (winTzNames.length === 1) {
					aras.setCommonPropertyValue("systemInfo_CurrentTimeZoneName", winTzNames[0]);
					aras.browserHelper.tzInfo.setTimeZoneNameInLocalStorage(tzLabel, winTzNames[0]);
					login();
				} else if (winTzNames.length > 1) {
					showTimeZoneSelectFrame(tzLabel, winTzNames, function(tzName) {
						aras.setCommonPropertyValue("systemInfo_CurrentTimeZoneName", tzName);
						aras.browserHelper.tzInfo.setTimeZoneNameInLocalStorage(tzLabel, tzName);
						hideTimeZoneSelectFrame();
						login();
					});
				}
			}
		}

		function validateCookiesEnabled() {
			return navigator.cookieEnabled ? Promise.resolve() : window.disabledCookiesDialog();
		}

		window.addEventListener('load', function() {
			aras.browserHelper.toggleSpinner(document, false, 'dimmer_spinner');

			validateCookiesEnabled()
				.then(window.validateBrowserCertified)
				.then(initLoginFrame);
		});

		window.onunload = function onunload_handler() {
			if (!window.aras) {
				return;
			}
			aras.setCommonPropertyValue('exitInProgress', true);
			aras.getOpenedWindowsCount(true);
			aras.unlockDirtyItems();
			aras.logout();
		}
		</script>
	</head>
	<body>
		<iframe id="tz" class="main" name="tz" frameborder="0"  style="z-index: 3" src="timeZoneDetect.html"></iframe>
		<iframe id="deepLinking" class="main" name="deepLinking" frameborder="0"  style="z-index: 2; display: none;"></iframe>
		<header id="header">
			<aras-toolbar id="headerCommandsBar"></aras-toolbar>
		</header>
		<main id="main-container">
			<aras-navigation-panel id="navigationPanel"></aras-navigation-panel>
			<div class="aras-splitter aras-hide" id="main-container-splitter"></div>
			<div id="center" class="aras-flex-grow content-block">
				<aras-header-tabs id="main-tab" class="content-block__main-tabs content-block__main-tabs_hidden"></aras-header-tabs>
				<div class="content-block__items-grid-container"></div>
			</div>
		</main>
		<iframe id="dimmer_spinner" src="Spinner.html"></iframe>
	</body>
</html>
