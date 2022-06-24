<?php
final class Page {
	private static $instance;

	private $page = 'user';
	private $id = '404';
	private $errorIds = array('400', '401', '403', '404');

	function __construct() {
		if(isset($_GET['page']) && $_GET['page'] != '') {
			if(file_exists('page/'.$_GET['page'].'.php')) {
				$this->page = $_GET['page'];
			}
			else{
				$this->page = 'error';
			}
		}
		if(isset($_GET['id']) && $_GET['id'] != '' && in_array($_GET['id'], $this->errorIds)) {
			$this->id = $_GET['id'];
		}
	}

	public static function getInstance() {
		if(self::$instance === null) {
			self::$instance = new self;
		}
		return self::$instance;
	}

	function getPage() {
		return $this->page;
	}

	function getId() {
		return $this->id;
	}

	function getPath() {
		return 'page/'.$this->page.'.php';
	}

	function getTitle() {
		$webTitle = Translator::getInstance()->getString('{*web.title}');
		$pageTitle = Translator::getInstance()->getString('{*page.'.$this->page.'.title}');
		$errorPageTitle = Translator::getInstance()->getString('{*page.'.$this->page.'.'.$this->id.'.title}');
		return ($this->page == 'error' ? $errorPageTitle : ($this->page == 'user' ? $webTitle : $pageTitle));
	}

	function getScripts() {
		switch($this->page) {
			case 'error':
				return '<!-- Script: Error.js -->
				<script type="text/javascript" src="src/js/error.js" defer></script>';
				break;
			case 'edit':
			case 'view':
				return '<!-- Script: Whiteboard.js -->
				<script type="text/javascript" src="src/js/whiteboard.js" defer></script>';
				break;
			case 'user':
				return '<!-- Script: User.js -->
				<script type="text/javascript" src="src/js/user.js" defer></script>';
				break;
		}
	}
}
?>