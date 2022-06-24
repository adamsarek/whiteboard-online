<?php
# Configuration details
$CONFIG = array(
	'authClientId' => '...',
	'ws' => '...'
);

# Show warnings
error_reporting(E_ALL);
ini_set('display_errors', 1);

# Headers
if(!headers_sent()) {
	$headers_list = headers_list();
	if(!in_array('X-Content-Type-Options', $headers_list))    { header('X-Content-Type-Options: nosniff'); }
	if(!in_array('X-Download-Options', $headers_list))        { header('X-Download-Options: noopen'); }
	if(!in_array('X-Frame-Options', $headers_list))           { header('X-Frame-Options: DENY'); }
	if(!in_array('X-XSS-Protection', $headers_list))          { header('X-XSS-Protection: 1; mode=block'); }
	if(!in_array('Content-Security-Policy', $headers_list))   { header('Content-Security-Policy: upgrade-insecure-requests; base-uri \'self\';'); }
	if(!in_array('Feature-Policy', $headers_list))            { header('Feature-Policy: camera \'self\'; geolocation \'self\'; microphone \'self\'; payment \'self\';'); }
	if(!in_array('Referrer-Policy', $headers_list))           { header('Referrer-Policy: strict-origin-when-cross-origin'); }
	if(!in_array('Strict-Transport-Security', $headers_list)) { header('Strict-Transport-Security: max-age=2592000; includeSubDomains'); }
	if(function_exists('header_remove')) {
		header_remove('Pragma');
		header_remove('X-Powered-By');
	}
}
ini_set('session.cookie_lifetime', 0);
ini_set('session.use_cookies', true);
ini_set('session.use_only_cookies', true);
ini_set('session.use_strict_mode', true);
ini_set('session.cookie_httponly', true);
ini_set('session.cookie_secure', true);
ini_set('session.cookie_samesite', 'Lax');
ini_set('session.use_trans_sid', false);
ini_set('session.cache_limited', 'nocache');
ini_set('session.sid_length', 48);
ini_set('session.sid_bits_per_character', 6);
ini_set('session.hash_function', 'sha512');

# Default locale
setlocale(LC_ALL, 'en_US.UTF-8');

# Session
session_start();
session_regenerate_id();

# Load class / interface / trait
function _class($fileName) { require_once('class/'.$fileName.'.php'); }
spl_autoload_register('_class');

# Class objects
$Translator = Translator::getInstance();
$Page = Page::getInstance();
?>

<!doctype html>
<html lang="<?php echo $Translator->getLanguage(); ?>">
	<head>
		<meta charset="UTF-8">

		<!-- General information -->
		<title><?php echo $Page->getTitle(); ?></title>
		<meta name="description" content="<?php echo $Translator->getString('{*web.description}'); ?>">
		<base href="/">

		<!-- Mobile-friendly -->
		<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
		<meta name="apple-mobile-web-app-capable" content="yes">
		<meta name="mobile-web-app-capable" content="yes">
		<meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no">

		<!-- Icons -->
		<link rel="apple-touch-icon" sizes="180x180" href="/src/img/icon/apple-touch-icon.png?v=20210403">
		<link rel="icon" type="image/png" sizes="32x32" href="/src/img/icon/favicon-32x32.png?v=20210403">
		<link rel="icon" type="image/png" sizes="16x16" href="/src/img/icon/favicon-16x16.png?v=20210403">
		<link rel="manifest" href="/src/img/icon/site.webmanifest?v=20210403">
		<link rel="mask-icon" href="/src/img/icon/safari-pinned-tab.svg?v=20210403" color="#cc0066">
		<link rel="shortcut icon" href="/src/img/icon/favicon.ico?v=20210403">
		<meta name="msapplication-TileColor" content="#eeeeee">
		<meta name="msapplication-config" content="/src/img/icon/browserconfig.xml?v=20210403">
		<meta name="theme-color" content="#eeeeee">

		<!-- Font: Material Icons -->
		<link rel="preload" as="font" type="font/woff2" href="src/font/MaterialIcons/MaterialIcons-Outlined.woff2" crossorigin="anonymous">

		<!-- Font: Open Sans -->
		<link rel="preload" as="font" type="font/woff2" href="src/font/OpenSans/OpenSans-Regular_latin.woff2" crossorigin="anonymous">
		<link rel="preload" as="font" type="font/woff2" href="src/font/OpenSans/OpenSans-Regular_latin-ext.woff2" crossorigin="anonymous">

		<!-- Stylesheet: Fonts -->
		<style type="text/css"><?php include('src/css/fonts.css'); ?></style>

		<!-- Stylesheet: Main -->
		<link rel="preload stylesheet" as="style" href="src/css/main.css" onload="this.onload=null;this.rel='stylesheet'">
		<noscript><link rel="stylesheet" href="src/css/main.css"></noscript>

		<!-- API: Google Platform Library -->
		<meta name="google-signin-client_id" content="<?php echo $CONFIG['authClientId']; ?>">
		<script src="https://apis.google.com/js/platform.js" async defer></script>

		<!-- Connection: WebSockets server -->
		<link rel="preconnect" href="<?php echo $CONFIG['ws']; ?>" crossorigin="anonymous">

		<?php echo $Page->getScripts(); ?>
	</head>
	<body><?php include_once($Page->getPath()); ?><div style="display:none"><endora></div></body>
</html>