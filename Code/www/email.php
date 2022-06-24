<?php
ini_set('display_errors', 0);
header('Content-Type: application/json; charset=UTF-8');

# Load class / interface / trait
function _class($fileName) { require_once('class/'.$fileName.'.php'); }
spl_autoload_register('_class');

# Class objects
$Translator = Translator::getInstance();

if(isset($_POST['to']) && isset($_POST['from']) && isset($_POST['link']) && isset($_POST['whiteboard']) && isset($_POST['signature'])) {
	$to = $_POST['to'];
	$from = '=?UTF-8?B?'.base64_encode($_POST['signature']).'?= <'.$_POST['from'].'>';
	$link = $_POST['link'];
	$whiteboard = $_POST['whiteboard'];
	$signature = $_POST['signature'];

	$subject = str_replace('[WHITEBOARD]', $whiteboard, $Translator->getString('{*email.subject}'));
	$body = "<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Transitional//EN\" \"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd\"><html xmlns=\"http://www.w3.org/1999/xhtml\" lang=\"".str_replace('_', '-', $Translator->getLanguageFull())."\"><head><meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\" /><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" /></head><body>".str_replace("\n", '&nbsp;<br>', str_replace('[WHITEBOARD]', "<a href=\"".$link."\">".$whiteboard."</a>", str_replace('[USER]', $signature, $Translator->getString('{*email.body}'))))."</body></html>";
	$headers[] = "From: ".$from;
	$headers[] = "Reply-To: ".$from;
	$headers[] = "MIME-Version: 1.0";
	$headers[] = "Content-Type: text/html; charset=UTF-8";
	$headers[] = "Content-Transfer-Encoding: base64";
	$headers[] = "X-Mailer: PHP/".phpversion();

	if(mail($to, '=?UTF-8?B?'.base64_encode($subject).'?=', base64_encode($body), implode("\r\n", $headers)."\r\n")) {
		// Email successfully sent
		echo json_encode(array('msg' => $Translator->getString('{*email.success.message}'), 'error' => false));
	}
	else {
		// Email error
		echo json_encode(array('msg' => $Translator->getString('{*email.error.message}'), 'error' => true));
	}
}
else {
	// Email not posted
	echo json_encode(array('msg' => $Translator->getString('{*email.error.message}'), 'error' => true));
}
?>