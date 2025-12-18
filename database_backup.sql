CREATE DATABASE  IF NOT EXISTS `seng429_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `seng429_db`;
-- MySQL dump 10.13  Distrib 8.0.40, for macos14 (arm64)
--
-- Host: localhost    Database: seng429_db
-- ------------------------------------------------------
-- Server version	9.0.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `appointments`
--

DROP TABLE IF EXISTS `appointments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `appointments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `patient_id` int NOT NULL,
  `doctor_id` int NOT NULL,
  `appointment_date` datetime NOT NULL,
  `reason` text,
  `status` enum('scheduled','completed','canceled') DEFAULT 'scheduled',
  `doctor_note` text,
  `time` varchar(5) NOT NULL DEFAULT '00:00',
  PRIMARY KEY (`id`),
  KEY `patient_id` (`patient_id`),
  KEY `doctor_id` (`doctor_id`),
  CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appointments`
--

LOCK TABLES `appointments` WRITE;
/*!40000 ALTER TABLE `appointments` DISABLE KEYS */;
INSERT INTO `appointments` VALUES (2,3,5,'2025-12-15 13:00:00','Ritim bozukluğu','scheduled',NULL,'00:00'),(3,3,7,'2025-12-18 09:30:00','Regl gecikmesi','canceled',NULL,'00:00'),(4,3,4,'2025-12-16 11:00:00','Sık sık baş dönmesi','scheduled',NULL,'00:00'),(5,3,7,'2025-12-19 00:00:00','Regl gecikmesi','scheduled',NULL,'00:00'),(6,3,2,'2025-12-19 00:00:00','Nefes Darlığı','completed','bıdı','11:00'),(7,4,8,'2025-12-17 00:00:00','Kolesterol rutin kontrol','scheduled',NULL,'16:30'),(8,4,12,'2025-12-17 00:00:00','Kan sonuçları kontrol','scheduled',NULL,'16:00'),(9,4,15,'2025-12-19 00:00:00','Geçmeyen baş ağrısı','scheduled',NULL,'09:00'),(10,4,10,'2025-12-18 00:00:00','nefes alamama','scheduled',NULL,'10:00'),(11,3,4,'2025-12-19 00:00:00','tahlil gösterme','scheduled',NULL,'09:00'),(12,6,3,'2025-12-25 00:00:00','dudak yarığı','scheduled',NULL,'10:00'),(13,6,8,'2025-12-19 00:00:00','yk','scheduled',NULL,'14:00'),(14,10,14,'2025-12-23 00:00:00','besin tüketmeme','scheduled',NULL,'15:00');
/*!40000 ALTER TABLE `appointments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `doctors`
--

DROP TABLE IF EXISTS `doctors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `doctors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `specialization` varchar(100) NOT NULL,
  `title` varchar(50) DEFAULT 'Dr.',
  `leave_dates` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `doctors_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `doctors`
--

LOCK TABLES `doctors` WRITE;
/*!40000 ALTER TABLE `doctors` DISABLE KEYS */;
INSERT INTO `doctors` VALUES (2,10,'Ceyhun','Karagöz','Göğüs Hastalıkları','Op. Dr.','[\"2025-12-19\",\"2026-01-13\"]'),(3,11,'Özge','Altınok','Plastik ve Rekonstrüktif Cerrahi','Prof. Dr.','[\"2025-12-24\"]'),(4,13,'Nisa','Konur','Beyin ve Sinir Cerrahisi','Prof. Dr.',NULL),(5,16,'Funda','Göktaş','Kardiyoloji','Prof. Dr.',NULL),(6,17,'Hande','Ataizi','Kulak Burun Boğaz Hastalıkları','Op. Dr.',NULL),(7,18,'Ata','Meret','Kadın Hastalıkları ve Doğum','Op. Dr.',NULL),(8,19,'Kemal','Doğan','Genel Dahiliye','Doç. Dr.',NULL),(10,20,'Bilge','Küçükçakmak','Kulak Burun Boğaz','Prof. Dr.',NULL),(11,21,'Yaren','Onar','Fizik Tedavi ve Rehabilitasyon','Op. Dr.',NULL),(12,22,'Güven','Yüreyi','Hematoloji','Op. Dr.',NULL),(13,23,'Kaan','Marıs','Psikiyatri','Doç. Dr.',NULL),(14,24,'Begüm','Koçmak','Yenidoğan ve Yenidoğan Yoğun Bakım','Op. Dr.',NULL),(15,25,'Selen','Yayik','Beyin ve Sinir Cerrahisi','Doç. Dr.',NULL),(16,36,'acil','doktor','Acil Servis','Dr.',NULL);
/*!40000 ALTER TABLE `doctors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `patients`
--

DROP TABLE IF EXISTS `patients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `patients` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `date_of_birth` date DEFAULT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `tc_no` varchar(11) DEFAULT NULL,
  `blood_type` varchar(5) DEFAULT NULL,
  `gender` varchar(10) DEFAULT NULL,
  `height` int DEFAULT NULL,
  `weight` int DEFAULT NULL,
  `allergies` text,
  `diseases` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `tc_no` (`tc_no`),
  CONSTRAINT `patients_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patients`
--

LOCK TABLES `patients` WRITE;
/*!40000 ALTER TABLE `patients` DISABLE KEYS */;
INSERT INTO `patients` VALUES (3,14,'Cemre','Güneş','1998-07-17','0577 777 77 77','22222222222','0-','Kadın',172,67,'Yok','Tansiyon'),(4,15,'Aynur','Kapan','1987-03-23','0566 666 66 66','33333333333','B+','Kadın',164,57,'Kedi tüyü','Şeker'),(5,26,'Cengiz','Taşdelen',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(6,27,'Barış','Muyal','2001-05-22','0511 111 11 11','11111111111','B-','Erkek',187,87,'Yok','yok'),(7,28,'Berkay','Boruk',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(8,29,'Arzu Tuğçe','Koca',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(9,30,'Berat','Darık',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(10,31,'Melek','Kösem','2025-11-19','--','44444444444','AB+','Kadın',39,5,'yok','yok'),(11,32,'Güner','Patavatsız',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(12,33,'Emirhan','Çakal',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(13,34,'Kaan','Avşar',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(14,35,'Egemen','Tilki',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `patients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','doctor','patient') NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (9,'admin@final.com','$2b$10$JXDwPJH2TrTYEnlRyPnjsOLV.SjgJIdzeDiv78FWtGnSoij9ytNkm','admin','2025-12-11 16:58:43'),(10,'ceyhunkaragoz@mail.com','$2b$10$TNkYaV2Wij53JOOwn48IHu0il7ku6GDL3q73g0Kya0P3nADC/tGTm','doctor','2025-12-12 07:54:48'),(11,'ozgealtinok@mail.com','$2b$10$Mw2Qt6swCHY9LsF.lP023ex.ikYC8nuopdVml19Hw9MGD3TTlHeEC','doctor','2025-12-12 08:01:13'),(13,'nisakonur@mail.com','$2b$10$yiBGokAsYC.9gqR1JBiCDOPeXojOvbqtMkaLB/PH/tkGklO9Gv97W','doctor','2025-12-13 14:21:18'),(14,'cemregunes@mail.com','$2b$10$H5s56VdpvCMhLijRQwa63OSDMmouDYVdp4mDXsQlPQAlF3w9PLkwm','patient','2025-12-13 14:44:06'),(15,'aynrkapn@mail.com','$2b$10$a4djBKEsjEXFLO1eh2SvweGnEKCJJkD.q0mtmIVmWfczAiSd1dDzS','patient','2025-12-13 14:47:35'),(16,'fundagoktas@mail.com','$2b$10$ziUjv8YhD59zxWY1bumPs.iP8bwViDz30sjeXZpSUPkieRjSithUy','doctor','2025-12-13 15:27:09'),(17,'handeaizi@mail.com','$2b$10$3wEsK2UGhar848mW/lkDWugLThYKqs.uGCNx/uMqJbF6H3qdrg/5W','doctor','2025-12-13 15:30:41'),(18,'atameret@mail.com','$2b$10$GHpG14ZLy1FnQLSj7ZS3ve/YSEAqDQKFruKyYX3WNtAvJGMNammre','doctor','2025-12-13 15:31:30'),(19,'kemaldogan@mail.com','$2b$10$fM54b2lmRkAE45OiA6W8w.l4xmUThP84TKOCTYOxLmhBXmlUvwzC2','doctor','2025-12-13 15:32:11'),(20,'bilgekucukcakmak@mail.com','$2b$10$4f46PwMXocJC8hPohNjg4uFaI/cyGuXfEiGRrnEcEudpe2q3LrRoO','doctor','2025-12-16 19:24:50'),(21,'yarenonar@mail.com','$2b$10$ZoNA7pS0wthwvd343Y4J6OjxtUJPRmjlO/nuv0zauht5BfqlOcLi.','doctor','2025-12-16 19:25:44'),(22,'guvenyureyi@mail.com','$2b$10$.T3k9N6GkDjdGu5Ey6g2F.ffS6g0bcReECNM77b.M0TzUe7Fza3SO','doctor','2025-12-16 19:27:19'),(23,'kaanmaris@mail.com','$2b$10$yoUXrhX9G1uBnNDFAUvfpuOsIYuwz4WVVp8yty1nUCgmyVbLM8RdG','doctor','2025-12-16 19:28:32'),(24,'begumkocmak@mail.com','$2b$10$yWyCvjTUSBI3kNeCJKZOJuUqXTauZISRNXFz/QP3wzbebzEq4AgBu','doctor','2025-12-16 19:30:11'),(25,'selenyayik@mail.com','$2b$10$vc205uVfkCOy/lYS9F.RQ.nsMBi4TatNk9FdoCj9nmu7EvDe7pyxq','doctor','2025-12-16 19:30:46'),(26,'cengiztasdelen@mail.com','$2b$10$li5YSjBmty8i0vyZRNqLD.X64ckCaLb2yB1EybC.86JNyAtEkcwBa','patient','2025-12-17 06:48:43'),(27,'barismuyal@mail.com','$2b$10$IWKUTh/NxQ6vb42qBab1xubxPgAt.FDjEfNX8RCAgU/zzrqCDRwxG','patient','2025-12-17 06:49:35'),(28,'berkayboruk@mail.com','$2b$10$PVKCSBfI8YCpzNZk4A5DDu2O0snlxXdrxZVrDRIr8KbDx02eKXx1C','patient','2025-12-17 06:50:58'),(29,'arzutugce@mail.com','$2b$10$7Htjemnpdi7.FycE.BXZLuKkL.iIJNqd0Hjg7S4YmaV6j6HxWoPZu','patient','2025-12-17 06:51:57'),(30,'beratdarik@mail.com','$2b$10$Xx0L38nHM/rQD9Qcqe7p/.cFABBMtNXqNWDcRu5xAyZLgl0cTl0IW','patient','2025-12-17 06:53:00'),(31,'melekosem@mail.com','$2b$10$qzWEfWgcZgT2osGwNykp2uer1Ywczoi1mUPs8zAi3Wg1M133GT3QW','patient','2025-12-17 06:54:06'),(32,'gunerpatavatsiz@mail.com','$2b$10$dzEgusm4eUBVRjnTdNFh9.dLdhvbLUuYHD9L9pd6zZKwZvQDBKA5G','patient','2025-12-17 06:55:04'),(33,'emirhancakal@mail.com','$2b$10$3cdyVAOJcxZ0xlpgoA5PputaqpsGbA7BCS.SKf8IFNNBTIzX3uK6C','patient','2025-12-17 06:55:30'),(34,'kaanavsar@mail.com','$2b$10$..aPIEOR0qZfg7I71han7eO9QOLqtUa1GR5QetAKwAvaP9esqTyle','patient','2025-12-17 06:56:09'),(35,'egementilki@mail.com','$2b$10$bc.RBauzDH6hotWW3GfIteQ1wb0NVFbnHWoGQMNeXuh05ihm.gN16','patient','2025-12-17 06:56:28'),(36,'acildoktor@mail.com','$2b$10$DLds3OkqkUfTmzRtjmQM7OYEIkXWC1UrsfaDRnK/Dqqsx5dAnDoOG','doctor','2025-12-17 07:23:26');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-18  9:24:56
