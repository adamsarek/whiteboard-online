<?php
final class Translator {
	private static $instance;

	private $browserLanguage = 'en';
	private $language = 'en';
	private $languageFull = 'en_US';
	private $languages = array();
	private $dictionary = array();

	function __construct() {
		// Languages
		$languages = [
			'cs' => 'cs_CZ',
			'en' => 'en_US'
		];

		// Get default language
		$acceptLanguages = array_keys($languages);
		$language = substr($_SERVER['HTTP_ACCEPT_LANGUAGE'], 0, 2);
		$this->browserLanguage = (in_array($language, $acceptLanguages) && file_exists('lang/'.$language.'.json') ? $language : $this->language);

		// Set language
		if(isset($_GET['lang']) && $_GET['lang'] != '' && file_exists('lang/'.$_GET['lang'].'.json')) {
			$_SESSION['lang'] = $_GET['lang'];
			$this->language = $_GET['lang'];
			$this->languageFull = $languages[$this->language];
		}
		else if(isset($_SESSION['lang']) && $_SESSION['lang'] != '' && file_exists('lang/'.$_SESSION['lang'].'.json')) {
			$this->language = $_SESSION['lang'];
			$this->languageFull = $languages[$this->language];
		}
		else {
			$this->language = $this->browserLanguage;
			$this->languageFull = $languages[$this->language];
		}
		setlocale(LC_ALL, $this->languageFull.'.UTF-8');

		// Load dictionary
		foreach(glob('lang/*.json') as $languageFile) {
			$language = pathinfo($languageFile, PATHINFO_FILENAME);
			$this->dictionary[$language] = json_decode(file_get_contents($languageFile),true);
			$this->languages[$language] = $this->getString('{language.'.$language.'}', $language);
		}
		array_multisort($this->languages, SORT_ASC, SORT_LOCALE_STRING, $this->languages);
	}

	public static function getInstance() {
		if(self::$instance === null) {
			self::$instance = new self;
		}
		return self::$instance;
	}

	function getBrowserLanguage() {
		return $this->browserLanguage;
	}

	function getLanguage() {
		return $this->language;
	}

	function getLanguageFull() {
		return $this->languageFull;
	}

	function getLanguages() {
		return $this->languages;
	}

	function getString($fromString, $toLanguage='') {
		$toString = $fromString;
		if($toLanguage == ''){ $toLanguage = $this->language; }

		preg_match_all('/{(.*?)}/', $fromString, $phrases);
		foreach($phrases[1] as $phrase) {
			if(isset($this->dictionary[$toLanguage][$phrase])) {
				$toString = $this->getString(str_replace('{'.$phrase.'}', $this->dictionary[$toLanguage][$phrase], $toString));
			}
			else if(substr_count($phrase,'.') > 0) {
				$phraseLayers = explode('.',$phrase);
				if(isset($this->dictionary[$toLanguage][$phraseLayers[0]])) {
					$phraseLastLayer = $this->dictionary[$toLanguage][$phraseLayers[0]];
					$i = 1;
					for(; $i < count($phraseLayers); $i++) {
						if(isset($phraseLastLayer[$phraseLayers[$i]])) {
							$phraseLastLayer = $phraseLastLayer[$phraseLayers[$i]];
						}
						else {
							break;
						}
					}
					if($i == count($phraseLayers)) {
						$toString = $this->getString(str_replace('{'.$phrase.'}', $phraseLastLayer, $toString));
					}
				}
			}
		}

		return $toString;
	}
}
?>