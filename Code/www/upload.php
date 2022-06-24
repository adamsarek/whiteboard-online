<?php
header('Content-Type: application/json');

function in_dir($fileX, $dir) {
	if($handle = opendir($dir)) {
		while(false !== ($fileY = readdir($handle))) {
			if(filesize($fileX) == filesize($dir.DIRECTORY_SEPARATOR.$fileY)) {
				$binX = fopen($fileX, 'rb');
				$binY = fopen($fileY, 'rb');
				while(($chunkX = fread($binX, 4096)) !== false) {
					$chunkY = fread($binY, 4096);
					if($chunkX !== $chunkY) {
						fclose($binX);
						fclose($binY);
						break;
						continue;
					}
				}
				fclose($binX);
				fclose($binY);
				return $dir.DIRECTORY_SEPARATOR.$fileY;
			}
		}
		closedir($handle);
		return false;
	}
	return false;
}

if(isset($_FILES['file'])) {
	// File posted
	if(is_uploaded_file($_FILES['file']['tmp_name'])) {
		// File uploaded
		if($_FILES['file']['size'] <= (10 * 1024 * 1024)) {
			// File has normal size
			$ext = substr($_FILES['file']['name'], strrpos($_FILES['file']['name'], '.') + 1);
			$tempFile = (ini_get( 'upload_tmp_dir' ) == '' ? sys_get_temp_dir() : ini_get('upload_tmp_dir')).md5(uniqid().$_FILES['file']['name']).'.'.$ext;
			$targetPath = 'upload';
			$targetFile = $targetPath.DIRECTORY_SEPARATOR.md5(uniqid().$_FILES['file']['name']).'.'.$ext;

			// Check image by extension and content
			$img = false;
			switch(exif_imagetype($_FILES['file']['tmp_name'])) {
				case 1:
					if($ext == 'gif') {
						$img = @imagecreatefromgif($_FILES['file']['tmp_name']);
						imagegif($img, $tempFile);
						imagedestroy($img);
					}
					break;
				case 2:
					if($ext == 'jpg' || $ext == 'jpeg' || $ext == 'jpe' || $ext == 'jif' || $ext == 'jfif' || $ext == 'jfi') {
						$img = @imagecreatefromjpeg($_FILES['file']['tmp_name']);
						imagejpeg($img, $tempFile);
						imagedestroy($img);
					}
					break;
				case 3:
					if($ext == 'png') {
						$img = @imagecreatefrompng($_FILES['file']['tmp_name']);
						imagepng($img, $tempFile);
						imagedestroy($img);
					}
					break;
				case 6:
					if($ext == 'bmp') {
						$img = @imagecreatefrombmp($_FILES['file']['tmp_name']);
						imagebmp($img, $tempFile);
						imagedestroy($img);
					}
					break;
				case 18:
					if($ext == 'webp') {
						$img = @imagecreatefromwebp($_FILES['file']['tmp_name']);
						imagewebp($img, $tempFile);
						imagedestroy($img);
					}
					break;
			}

			// Move to upload folder or delete
			if(file_exists($tempFile)) {
				if(!file_exists($targetPath)) {
					mkdir($targetPath);

					if(!rename($tempFile, getcwd().DIRECTORY_SEPARATOR.$targetFile)) {
						unlink($tempFile);
					}
					else {
						// Upload successful, return link
						echo json_encode(array('msg' => $targetFile, 'error' => false));
					}
				}
				else {
					if($copyFile = in_dir($tempFile, $targetPath)) {
						if(!rename($tempFile, getcwd().DIRECTORY_SEPARATOR.$copyFile)) {
							unlink($tempFile);
						}
						else {
							// Upload successful, return link
							echo json_encode(array('msg' => $copyFile, 'error' => false));
						}
					}
					else {
						if(!rename($tempFile, getcwd().DIRECTORY_SEPARATOR.$targetFile)) {
							unlink($tempFile);
						}
						else {
							// Upload successful, return link
							echo json_encode(array('msg' => $targetFile, 'error' => false));
						}
					}
				}
			}
			else if(file_exists($_FILES['file']['tmp_name'])) {
				unlink($_FILES['file']['tmp_name']);
			}
		}
		else {
			// File is too big
			if(file_exists($_FILES['file']['tmp_name'])) {
				unlink($_FILES['file']['tmp_name']);
			}

			echo json_encode(array('msg' => 'File '.$_FILES['file']['name'].' is too big!', 'error' => true));
		}

		// Delete temporary file
		if(file_exists($_FILES['file']['tmp_name'])) {
			unlink($_FILES['file']['tmp_name']);
		}
	}
	else {
		// File not uploaded
		echo json_encode(array('msg' => 'File '.$_FILES['file']['name'].' upload failed!', 'error' => true));
	}
}
else {
	// File not posted
	echo json_encode(array('msg' => 'File '.$_FILES['file']['name'].' post request failed!', 'error' => true));
}
?>