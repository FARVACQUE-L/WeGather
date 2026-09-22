DROP DATABASE IF EXISTS wegather;

-- -----------------------------------------------------
-- Schema wegather
-- -----------------------------------------------------
CREATE DATABASE `wegather` DEFAULT CHARACTER SET utf8 ;
USE `wegather` ;

-- -----------------------------------------------------
-- Table `user`
-- -----------------------------------------------------
CREATE TABLE `user` (
  `user_id` INT NOT NULL AUTO_INCREMENT,
  `user_name` VARCHAR(100) NOT NULL,
  `user_username` VARCHAR(45) NOT NULL,
  `user_mail` VARCHAR(100) NOT NULL,
  `user_password` VARCHAR(100) NOT NULL,
  `user_profile_picture` VARCHAR(255) NOT NULL,
  `user_joining_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_reset_token` VARCHAR(255) NULL,
  `user_reset_expires` BIGINT NULL,

  `user_is_admin` TINYINT(1) NOT NULL DEFAULT 0,
  `user_is_ban` TINYINT(1) NOT NULL DEFAULT 0,

  PRIMARY KEY (`user_id`),

  UNIQUE (`user_username`),
  UNIQUE (`user_mail`))
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `reported_user`
-- -----------------------------------------------------
CREATE TABLE `reported_user` (
  `reported_user_id` INT NOT NULL AUTO_INCREMENT,
  `reported_user_id_user` INT NOT NULL,
  `reported_user_by_id_user` INT NOT NULL,
  `reported_user_id_event` INT NOT NULL,
  `reported_user_description` VARCHAR(255) NOT NULL,
  `reported_user_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  `reported_user_is_done` TINYINT(1) NOT NULL DEFAULT 0,

  PRIMARY KEY (`reported_user_id`),

  CONSTRAINT `fk_reported_user_user`
    FOREIGN KEY (`reported_user_id_user`)
    REFERENCES `user` (`user_id`),

  CONSTRAINT `fk_reported_user_by_user`
    FOREIGN KEY (`reported_user_by_id_user`)
    REFERENCES `user` (`user_id`))
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `reported_user_image`
-- -----------------------------------------------------
CREATE TABLE `reported_user_image` (
  `reported_user_image_id` INT NOT NULL AUTO_INCREMENT,
  `reported_user_image_path` VARCHAR(255) NOT NULL,
  `reported_user_image_by_id_reported_user` INT NOT NULL,

  PRIMARY KEY (`reported_user_image_id`),

  CONSTRAINT `fk_reported_user_image_user`
    FOREIGN KEY (`reported_user_image_by_id_reported_user`)
    REFERENCES `reported_user` (`reported_user_id`)
    ON DELETE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `event`
-- -----------------------------------------------------
CREATE TABLE `event` (
  `event_id` INT NOT NULL AUTO_INCREMENT,
`event_uuid` VARCHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
  `event_id_host` INT NOT NULL,
  `event_name` VARCHAR(45) NOT NULL,
  `event_date_start` DATE NOT NULL,
  `event_date_end` DATE NOT NULL,
  `event_description` VARCHAR(255) NOT NULL,
  `event_location` VARCHAR(100) NOT NULL,
  `event_creation_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `event_picture` VARCHAR(255) NOT NULL,
 `event_is_ban` TINYINT(1) NOT NULL DEFAULT 0,

  `event_link_key` VARCHAR(6) NOT NULL, -- const code = Math.random().toString(36).substring(2, 8).toUpperCase();

  PRIMARY KEY (`event_id`),
  UNIQUE (`event_uuid`),
  UNIQUE (`event_link_key`),

  CONSTRAINT `fk_event_user`
    FOREIGN KEY (`event_id_host`)
    REFERENCES `user` (`user_id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `reported_event`
-- -----------------------------------------------------
CREATE TABLE `reported_event` (
  `reported_event_id` INT NOT NULL AUTO_INCREMENT,
  `reported_event_id_event` INT NOT NULL,
  `reported_event_by_id_user` INT NOT NULL,
  `reported_event_description` VARCHAR(255) NOT NULL,
  `reported_event_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  `reported_event_is_done` TINYINT(1) NOT NULL DEFAULT 0,

  PRIMARY KEY (`reported_event_id`),

  CONSTRAINT `fk_reported_event_event`
    FOREIGN KEY (`reported_event_id_event`)
    REFERENCES `event` (`event_id`),

  CONSTRAINT `fk_reported_event_user`
    FOREIGN KEY (`reported_event_by_id_user`)
    REFERENCES `user` (`user_id`))
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `reported_event_image`
-- -----------------------------------------------------
CREATE TABLE `reported_event_image` (
  `reported_event_image_id` INT NOT NULL AUTO_INCREMENT,
  `reported_event_image_path` VARCHAR(255) NOT NULL,
  `reported_event_image_by_id_reported_event` INT NOT NULL,

  PRIMARY KEY (`reported_event_image_id`),

  CONSTRAINT `fk_reported_event_image_event`
    FOREIGN KEY (`reported_event_image_by_id_reported_event`)
    REFERENCES `reported_event` (`reported_event_id`)
    ON DELETE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `reported_bug`
-- -----------------------------------------------------
CREATE TABLE `reported_bug` (
  `reported_bug_id` INT NOT NULL AUTO_INCREMENT,
  `reported_bug_by_id_user` INT NOT NULL,
  `reported_bug_description` VARCHAR(255) NOT NULL,
  `reported_bug_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  `reported_bug_is_done` TINYINT(1) NOT NULL DEFAULT 0,

  PRIMARY KEY (`reported_bug_id`),

  CONSTRAINT `fk_reported_bug_user`
    FOREIGN KEY (`reported_bug_by_id_user`)
    REFERENCES `user` (`user_id`))
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `reported_bug_image`
-- -----------------------------------------------------
CREATE TABLE `reported_bug_image` (
  `reported_bug_image_id` INT NOT NULL AUTO_INCREMENT,
  `reported_bug_image_path` VARCHAR(255) NOT NULL,
  `reported_bug_image_by_id_reported_bug` INT NOT NULL,

  PRIMARY KEY (`reported_bug_image_id`),

  CONSTRAINT `fk_reported_bug_image_bug`
    FOREIGN KEY (`reported_bug_image_by_id_reported_bug`)
    REFERENCES `reported_bug` (`reported_bug_id`)
    ON DELETE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `message`
-- -----------------------------------------------------
CREATE TABLE `message` (
  `message_id` INT NOT NULL AUTO_INCREMENT,
  `message_id_event` INT NOT NULL,
  `message_id_user` INT NOT NULL,
  `message_text` TEXT
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci
    NOT NULL,
  `message_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`message_id`),

  CONSTRAINT `fk_message_user`
    FOREIGN KEY (`message_id_user`)
    REFERENCES `user` (`user_id`),

  CONSTRAINT `fk_message_event`
    FOREIGN KEY (`message_id_event`)
    REFERENCES `event` (`event_id`))
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `message_read`
-- -----------------------------------------------------
CREATE TABLE message_read (
    message_read_id INT AUTO_INCREMENT PRIMARY KEY,
    message_read_id_message INT NOT NULL,
    message_read_user_id INT NOT NULL,
    message_read_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (message_read_id_message)
        REFERENCES message(message_id)
        ON DELETE CASCADE,

    FOREIGN KEY (message_read_user_id)
        REFERENCES user(user_id)
        ON DELETE CASCADE
)ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `budget`
-- -----------------------------------------------------
CREATE TABLE `budget` (
  `budget_id` INT NOT NULL AUTO_INCREMENT,
  `budget_id_event` INT NOT NULL,
  `budget_id_user` INT NOT NULL,
  `budget_name` VARCHAR(255) NOT NULL,
  `budget_price` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `budget_creation_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`budget_id`),

  CONSTRAINT `fk_budget_user`
    FOREIGN KEY (`budget_id_user`)
    REFERENCES `user` (`user_id`),

  CONSTRAINT `fk_budget_event`
    FOREIGN KEY (`budget_id_event`)
    REFERENCES `event` (`event_id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `todo`
-- -----------------------------------------------------
CREATE TABLE `todo` (
  `todo_id` INT NOT NULL AUTO_INCREMENT,
  `todo_id_event` INT NOT NULL,
  `todo_id_user` INT NOT NULL,
  `todo_name` VARCHAR(255) NOT NULL,
  `todo_creation_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `todo_deadline` DATETIME NULL,

  `todo_is_done` TINYINT(1) NOT NULL DEFAULT 0,

  PRIMARY KEY (`todo_id`),

  CONSTRAINT `fk_todo_user`
    FOREIGN KEY (`todo_id_user`)
    REFERENCES `user` (`user_id`),

  CONSTRAINT `fk_todo_event`
    FOREIGN KEY (`todo_id_event`)
    REFERENCES `event` (`event_id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `reservation`
-- -----------------------------------------------------
CREATE TABLE `reservation` (
  `reservation_id` INT NOT NULL AUTO_INCREMENT,
  `reservation_id_event` INT NOT NULL,
  `reservation_id_user` INT NOT NULL,
  `reservation_name` VARCHAR(255) NOT NULL,
  `reservation_date` DATE NOT NULL,
  `reservation_location` VARCHAR(255) NOT NULL,
  `reservation_description` VARCHAR(255) NOT NULL,
  `reservation_link` VARCHAR(255) NULL,
  `reservation_picture` VARCHAR(255) NOT NULL,
  `reservation_creation_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`reservation_id`),

  CONSTRAINT `fk_reservation_event`
    FOREIGN KEY (`reservation_id_event`)
    REFERENCES `event` (`event_id`),

  CONSTRAINT `fk_reservation_user`
    FOREIGN KEY (`reservation_id_user`)
    REFERENCES `user` (`user_id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `gallery`
-- -----------------------------------------------------
CREATE TABLE `gallery` (
  `gallery_id` INT NOT NULL AUTO_INCREMENT,
  `gallery_id_event` INT NOT NULL,
  `gallery_id_user` INT NOT NULL,
  `gallery_link` VARCHAR(255) NOT NULL,
  `gallery_description` VARCHAR(255) NULL,
  `gallery_creation_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`gallery_id`),

  CONSTRAINT `fk_gallery_event`
    FOREIGN KEY (`gallery_id_event`)
    REFERENCES `event` (`event_id`),

  CONSTRAINT `fk_gallery_user`
    FOREIGN KEY (`gallery_id_user`)
    REFERENCES `user` (`user_id`))
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `gallery_like`
-- -----------------------------------------------------
CREATE TABLE `gallery_like` (
  `gallery_like_id_gallery` INT NOT NULL,
  `gallery_like_id_user` INT NOT NULL,

  PRIMARY KEY (`gallery_like_id_gallery`, `gallery_like_id_user`),

  CONSTRAINT `fk_like_gallery`
    FOREIGN KEY (`gallery_like_id_gallery`)
    REFERENCES `gallery` (`gallery_id`)
    ON DELETE CASCADE,

  CONSTRAINT `fk_like_user`
    FOREIGN KEY (`gallery_like_id_user`)
    REFERENCES `user` (`user_id`)
    ON DELETE CASCADE
) ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `event_user_ban`
-- -----------------------------------------------------
CREATE TABLE `event_user_ban` (
  `eub_id_event` INT NOT NULL,
  `eub_id_user` INT NOT NULL,

  PRIMARY KEY (`eub_id_event`, `eub_id_user`),

  CONSTRAINT `fk_eub_event`
    FOREIGN KEY (`eub_id_event`)
    REFERENCES `event` (`event_id`),

  CONSTRAINT `fk_eub_user`
    FOREIGN KEY (`eub_id_user`)
    REFERENCES `user` (`user_id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `event_user_joining`
-- -----------------------------------------------------
CREATE TABLE `event_user_joining` (
  `euj_id_event` INT NOT NULL,
  `euj_id_user` INT NOT NULL,

  PRIMARY KEY (`euj_id_event`, `euj_id_user`),

  CONSTRAINT `fk_euj_event`
    FOREIGN KEY (`euj_id_event`)
    REFERENCES `event` (`event_id`),

  CONSTRAINT `fk_euj_user`
    FOREIGN KEY (`euj_id_user`)
    REFERENCES `user` (`user_id`))
ENGINE = InnoDB;