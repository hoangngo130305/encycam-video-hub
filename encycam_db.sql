-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 17, 2026 at 04:23 AM
-- Server version: 10.11.16-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `encycam_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `audit_log`
--

CREATE TABLE `audit_log` (
  `id` bigint(20) NOT NULL,
  `timestamp` datetime(6) NOT NULL,
  `action` longtext NOT NULL,
  `resource_type` varchar(20) NOT NULL,
  `resource_id` int(10) UNSIGNED DEFAULT NULL CHECK (`resource_id` >= 0),
  `details` longtext NOT NULL,
  `user_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `audit_log`
--

INSERT INTO `audit_log` (`id`, `timestamp`, `action`, `resource_type`, `resource_id`, `details`, `user_id`) VALUES
(1, '2026-06-10 01:42:00.000000', 'Upload \"Hướng dẫn chụp ảnh chân dung\" → v3', 'video', 1, '', 2),
(2, '2026-06-10 01:20:00.000000', 'Comment tại 04:32 — \"Âm thanh bị rè...\"', 'video', 1, '', 5),
(3, '2026-06-09 09:55:00.000000', 'Mở video \"Top 5 ống kính kit\" để xem (chưa quyết định)', 'video', 3, '', 6),
(4, '2026-06-08 03:30:00.000000', 'Approve \"Top 5 ống kính kit\" — chuyển Duyệt cuối', 'video', 3, '', 5),
(5, '2026-06-07 07:00:00.000000', 'Upload \"Top 5 ống kính kit\" → v2 (sửa theo comment)', 'video', 3, '', 2),
(6, '2026-06-06 02:00:00.000000', 'Yêu cầu sửa \"Top 5 ống kính kit\" v1 — âm thanh clip', 'video', 3, '', 5),
(7, '2026-06-05 04:00:00.000000', 'Khoá tài khoản Lê Tuấn', 'user', NULL, '', 1),
(8, '2026-06-03 09:20:00.000000', 'Approve \"Cách chỉnh màu Lightroom\" — published ✅', 'video', 4, '', 6),
(9, '2026-06-02 07:00:00.000000', 'Approve \"Cách chỉnh màu Lightroom\" — chuyển Duyệt cuối', 'video', 4, '', 5),
(10, '2026-06-01 02:00:00.000000', 'Upload \"Cách chỉnh màu Lightroom\" → v1', 'video', 4, '', 2),
(11, '2026-06-16 17:25:39.966742', 'Khoá tài khoản Bùi Khoa', 'user', 8, '', 1),
(12, '2026-06-16 17:25:41.420876', 'Mở khoá tài khoản Bùi Khoa', 'user', 8, '', 1),
(13, '2026-06-16 19:07:04.604253', 'Upload mới \"upload_phude\" → v1 (Django Admin)', 'video', 8, '', 1),
(14, '2026-06-16 19:13:52.470192', 'Comment tại — — \"vidoe chất lượng thấp\"', 'video', 8, '', 1),
(15, '2026-06-16 19:23:54.773181', 'Bắt đầu review \"upload_phude\"', 'video', 8, '', 5),
(16, '2026-06-16 19:24:09.901574', 'Yêu cầu sửa \"upload_phude\" — fd', 'video', 8, '', 5),
(17, '2026-06-16 19:26:39.169503', 'Upload mới \"t3wr\" → v1', 'video', 9, '', 2),
(18, '2026-06-16 19:27:06.016563', 'Bắt đầu review \"t3wr\"', 'video', 9, '', 5),
(19, '2026-06-16 19:27:09.110329', 'Approve \"t3wr\" — chuyển Duyệt cuối', 'video', 9, '', 5),
(20, '2026-06-16 19:27:26.952407', 'Approve \"t3wr\" — published ✅', 'video', 9, '', 6),
(21, '2026-06-16 19:33:19.553870', 'Yêu cầu sửa \"upload_phude\" — ttt', 'video', 8, '', 5),
(22, '2026-06-16 19:46:22.852603', 'Bắt đầu review \"Macro photography với kit lens — Chi tiết kỹ thuật\"', 'video', 5, '', 5),
(23, '2026-06-16 19:46:22.882775', 'Yêu cầu sửa \"Macro photography với kit lens — Chi tiết kỹ thuật\" — Can sua lai phan am thanh', 'video', 5, '', 5),
(24, '2026-06-16 20:02:12.554484', 'Yêu cầu sửa \"upload_phude\" — fff', 'video', 8, '', 5),
(25, '2026-06-16 20:03:43.654890', 'Upload \"upload_phude\" → v2', 'video', 8, '', 8),
(26, '2026-06-16 20:04:25.700497', 'Comment tại — — \"ê\"', 'video', 8, '', 5),
(27, '2026-06-16 20:04:47.592219', 'Approve \"upload_phude\" — chuyển Duyệt cuối', 'video', 8, '', 5);

-- --------------------------------------------------------

--
-- Table structure for table `auth_group`
--

CREATE TABLE `auth_group` (
  `id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `auth_group_permissions`
--

CREATE TABLE `auth_group_permissions` (
  `id` bigint(20) NOT NULL,
  `group_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `auth_permission`
--

CREATE TABLE `auth_permission` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `content_type_id` int(11) NOT NULL,
  `codename` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `auth_permission`
--

INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES
(1, 'Can add log entry', 1, 'add_logentry'),
(2, 'Can change log entry', 1, 'change_logentry'),
(3, 'Can delete log entry', 1, 'delete_logentry'),
(4, 'Can view log entry', 1, 'view_logentry'),
(5, 'Can add permission', 2, 'add_permission'),
(6, 'Can change permission', 2, 'change_permission'),
(7, 'Can delete permission', 2, 'delete_permission'),
(8, 'Can view permission', 2, 'view_permission'),
(9, 'Can add group', 3, 'add_group'),
(10, 'Can change group', 3, 'change_group'),
(11, 'Can delete group', 3, 'delete_group'),
(12, 'Can view group', 3, 'view_group'),
(13, 'Can add content type', 4, 'add_contenttype'),
(14, 'Can change content type', 4, 'change_contenttype'),
(15, 'Can delete content type', 4, 'delete_contenttype'),
(16, 'Can view content type', 4, 'view_contenttype'),
(17, 'Can add session', 5, 'add_session'),
(18, 'Can change session', 5, 'change_session'),
(19, 'Can delete session', 5, 'delete_session'),
(20, 'Can view session', 5, 'view_session'),
(21, 'Can add blacklisted token', 6, 'add_blacklistedtoken'),
(22, 'Can change blacklisted token', 6, 'change_blacklistedtoken'),
(23, 'Can delete blacklisted token', 6, 'delete_blacklistedtoken'),
(24, 'Can view blacklisted token', 6, 'view_blacklistedtoken'),
(25, 'Can add outstanding token', 7, 'add_outstandingtoken'),
(26, 'Can change outstanding token', 7, 'change_outstandingtoken'),
(27, 'Can delete outstanding token', 7, 'delete_outstandingtoken'),
(28, 'Can view outstanding token', 7, 'view_outstandingtoken'),
(29, 'Can add Người dùng', 8, 'add_user'),
(30, 'Can change Người dùng', 8, 'change_user'),
(31, 'Can delete Người dùng', 8, 'delete_user'),
(32, 'Can view Người dùng', 8, 'view_user'),
(33, 'Can add Video', 9, 'add_video'),
(34, 'Can change Video', 9, 'change_video'),
(35, 'Can delete Video', 9, 'delete_video'),
(36, 'Can view Video', 9, 'view_video'),
(37, 'Can add Lịch sử duyệt', 10, 'add_historyentry'),
(38, 'Can change Lịch sử duyệt', 10, 'change_historyentry'),
(39, 'Can delete Lịch sử duyệt', 10, 'delete_historyentry'),
(40, 'Can view Lịch sử duyệt', 10, 'view_historyentry'),
(41, 'Can add Comment', 11, 'add_comment'),
(42, 'Can change Comment', 11, 'change_comment'),
(43, 'Can delete Comment', 11, 'delete_comment'),
(44, 'Can view Comment', 11, 'view_comment'),
(45, 'Can add Phiên bản video', 12, 'add_videoversion'),
(46, 'Can change Phiên bản video', 12, 'change_videoversion'),
(47, 'Can delete Phiên bản video', 12, 'delete_videoversion'),
(48, 'Can view Phiên bản video', 12, 'view_videoversion'),
(49, 'Can add Thông báo', 13, 'add_notification'),
(50, 'Can change Thông báo', 13, 'change_notification'),
(51, 'Can delete Thông báo', 13, 'delete_notification'),
(52, 'Can view Thông báo', 13, 'view_notification'),
(53, 'Can add Audit log', 14, 'add_auditentry'),
(54, 'Can change Audit log', 14, 'change_auditentry'),
(55, 'Can delete Audit log', 14, 'delete_auditentry'),
(56, 'Can view Audit log', 14, 'view_auditentry');

-- --------------------------------------------------------

--
-- Table structure for table `comments`
--

CREATE TABLE `comments` (
  `id` bigint(20) NOT NULL,
  `text` longtext NOT NULL,
  `timestamp` varchar(10) NOT NULL,
  `resolved` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `video_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `comments`
--

INSERT INTO `comments` (`id`, `text`, `timestamp`, `resolved`, `created_at`, `user_id`, `video_id`) VALUES
(1, 'Đoạn này âm thanh bị rè, @HoàngMinh cần record lại narration từ đây.', '04:32', 0, '2026-06-15 16:02:29.947588', 5, 1),
(2, 'Thiếu lower third ở đây — thêm tên + chức danh người được phỏng vấn.', '07:15', 0, '2026-06-15 16:02:29.949303', 5, 1),
(3, 'Intro dài quá, cắt bớt phần setup đầu.', '01:08', 1, '2026-06-15 16:02:29.950663', 5, 1),
(4, 'Phần B-roll máy quay quá tối, cần điều chỉnh exposure.', '02:15', 0, '2026-06-15 16:02:29.960208', 5, 2),
(5, 'Âm thanh bị clip tại đây, tiếng kít.', '03:20', 1, '2026-06-15 16:02:29.982034', 5, 3),
(6, 'Đã fix trong v2, anh check lại nhé.', '03:20', 1, '2026-06-15 16:02:29.983081', 2, 3),
(7, 'Thêm CTA end screen cho video này.', '', 1, '2026-06-15 16:02:29.984054', 5, 3),
(8, 'Cảnh ban đêm hơi nhiều noise, check noise reduction.', '05:30', 0, '2026-06-15 16:02:30.008006', 7, 6),
(9, 'Âm thanh cần record lại, chất lượng quá kém ở đây.', '01:20', 0, '2026-06-15 16:02:30.021394', 5, 7),
(10, 'vidoe chất lượng thấp', '', 1, '2026-06-16 19:13:52.468372', 1, 8),
(11, 'ê', '', 1, '2026-06-16 20:04:25.699308', 5, 8);

-- --------------------------------------------------------

--
-- Table structure for table `django_admin_log`
--

CREATE TABLE `django_admin_log` (
  `id` int(11) NOT NULL,
  `action_time` datetime(6) NOT NULL,
  `object_id` longtext DEFAULT NULL,
  `object_repr` varchar(200) NOT NULL,
  `action_flag` smallint(5) UNSIGNED NOT NULL CHECK (`action_flag` >= 0),
  `change_message` longtext NOT NULL,
  `content_type_id` int(11) DEFAULT NULL,
  `user_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `django_admin_log`
--

INSERT INTO `django_admin_log` (`id`, `action_time`, `object_id`, `object_repr`, `action_flag`, `change_message`, `content_type_id`, `user_id`) VALUES
(1, '2026-06-16 19:07:04.605039', '8', '[VideoID_2008] upload_phude', 1, '[{\"added\": {}}]', 9, 1);

-- --------------------------------------------------------

--
-- Table structure for table `django_content_type`
--

CREATE TABLE `django_content_type` (
  `id` int(11) NOT NULL,
  `app_label` varchar(100) NOT NULL,
  `model` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `django_content_type`
--

INSERT INTO `django_content_type` (`id`, `app_label`, `model`) VALUES
(8, 'accounts', 'user'),
(1, 'admin', 'logentry'),
(14, 'audit', 'auditentry'),
(3, 'auth', 'group'),
(2, 'auth', 'permission'),
(4, 'contenttypes', 'contenttype'),
(13, 'notifications', 'notification'),
(5, 'sessions', 'session'),
(6, 'token_blacklist', 'blacklistedtoken'),
(7, 'token_blacklist', 'outstandingtoken'),
(11, 'videos', 'comment'),
(10, 'videos', 'historyentry'),
(9, 'videos', 'video'),
(12, 'videos', 'videoversion');

-- --------------------------------------------------------

--
-- Table structure for table `django_migrations`
--

CREATE TABLE `django_migrations` (
  `id` bigint(20) NOT NULL,
  `app` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `applied` datetime(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `django_migrations`
--

INSERT INTO `django_migrations` (`id`, `app`, `name`, `applied`) VALUES
(1, 'contenttypes', '0001_initial', '2026-06-15 16:02:15.100267'),
(2, 'contenttypes', '0002_remove_content_type_name', '2026-06-15 16:02:15.131709'),
(3, 'auth', '0001_initial', '2026-06-15 16:02:15.221754'),
(4, 'auth', '0002_alter_permission_name_max_length', '2026-06-15 16:02:15.243558'),
(5, 'auth', '0003_alter_user_email_max_length', '2026-06-15 16:02:15.252450'),
(6, 'auth', '0004_alter_user_username_opts', '2026-06-15 16:02:15.258974'),
(7, 'auth', '0005_alter_user_last_login_null', '2026-06-15 16:02:15.263731'),
(8, 'auth', '0006_require_contenttypes_0002', '2026-06-15 16:02:15.265372'),
(9, 'auth', '0007_alter_validators_add_error_messages', '2026-06-15 16:02:15.269105'),
(10, 'auth', '0008_alter_user_username_max_length', '2026-06-15 16:02:15.274363'),
(11, 'auth', '0009_alter_user_last_name_max_length', '2026-06-15 16:02:15.279680'),
(12, 'auth', '0010_alter_group_name_max_length', '2026-06-15 16:02:15.292571'),
(13, 'auth', '0011_update_proxy_permissions', '2026-06-15 16:02:15.298634'),
(14, 'auth', '0012_alter_user_first_name_max_length', '2026-06-15 16:02:15.302264'),
(15, 'accounts', '0001_initial', '2026-06-15 16:02:15.413159'),
(16, 'admin', '0001_initial', '2026-06-15 16:02:15.469165'),
(17, 'admin', '0002_logentry_remove_auto_add', '2026-06-15 16:02:15.482777'),
(18, 'admin', '0003_logentry_add_action_flag_choices', '2026-06-15 16:02:15.488460'),
(19, 'audit', '0001_initial', '2026-06-15 16:02:15.518076'),
(20, 'videos', '0001_initial', '2026-06-15 16:02:15.736055'),
(21, 'notifications', '0001_initial', '2026-06-15 16:02:15.796390'),
(22, 'sessions', '0001_initial', '2026-06-15 16:02:15.814494'),
(23, 'token_blacklist', '0001_initial', '2026-06-15 16:02:15.879281'),
(24, 'token_blacklist', '0002_outstandingtoken_jti_hex', '2026-06-15 16:02:15.897023'),
(25, 'token_blacklist', '0003_auto_20171017_2007', '2026-06-15 16:02:15.921864'),
(26, 'token_blacklist', '0004_auto_20171017_2013', '2026-06-15 16:02:15.952257'),
(27, 'token_blacklist', '0005_remove_outstandingtoken_jti', '2026-06-15 16:02:15.976955'),
(28, 'token_blacklist', '0006_auto_20171017_2113', '2026-06-15 16:02:16.000115'),
(29, 'token_blacklist', '0007_auto_20171017_2214', '2026-06-15 16:02:18.446650'),
(30, 'token_blacklist', '0008_migrate_to_bigautofield', '2026-06-15 16:02:18.741859'),
(31, 'token_blacklist', '0010_fix_migrate_to_bigautofield', '2026-06-15 16:02:18.754117'),
(32, 'token_blacklist', '0011_linearizes_history', '2026-06-15 16:02:18.755597'),
(33, 'token_blacklist', '0012_alter_outstandingtoken_user', '2026-06-15 16:02:18.764818');

-- --------------------------------------------------------

--
-- Table structure for table `django_session`
--

CREATE TABLE `django_session` (
  `session_key` varchar(40) NOT NULL,
  `session_data` longtext NOT NULL,
  `expire_date` datetime(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `django_session`
--

INSERT INTO `django_session` (`session_key`, `session_data`, `expire_date`) VALUES
('ndhqazufhj2m4tc2geget2gxjek32457', '.eJxVjEEOwiAQRe_C2hAoDlCX7nsGMjCMVA0kpV0Z765NutDtf-_9lwi4rSVsPS9hJnERWpx-t4jpkesO6I711mRqdV3mKHdFHrTLqVF-Xg_376BgL9-aDbMDr7Q1bkyQrEafIwKxMc4jKUYANRjIYHnUCUwkgOFsfaJMDsX7A-MuOA4:1wZKqF:VZTgsRY5fDv0D19KiUmF2Pz7tjbaCI8LuMNnBUWDD7U', '2026-06-30 10:51:59.813181');

-- --------------------------------------------------------

--
-- Table structure for table `history_entries`
--

CREATE TABLE `history_entries` (
  `id` bigint(20) NOT NULL,
  `timestamp` datetime(6) NOT NULL,
  `action` longtext NOT NULL,
  `from_status` varchar(30) DEFAULT NULL,
  `to_status` varchar(30) DEFAULT NULL,
  `user_id` bigint(20) NOT NULL,
  `video_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `history_entries`
--

INSERT INTO `history_entries` (`id`, `timestamp`, `action`, `from_status`, `to_status`, `user_id`, `video_id`) VALUES
(1, '2026-06-03 02:00:00.000000', 'Upload v1', NULL, 'pending', 2, 1),
(2, '2026-06-04 03:00:00.000000', 'Bắt đầu review v1', 'pending', 'reviewing', 5, 1),
(3, '2026-06-04 07:00:00.000000', 'Yêu cầu sửa — âm thanh 04:32', 'reviewing', 'needs_revision', 5, 1),
(4, '2026-06-05 01:00:00.000000', 'Upload v2 (đã sửa âm thanh)', NULL, NULL, 2, 1),
(5, '2026-06-05 08:00:00.000000', 'Yêu cầu sửa — thiếu lower third 07:15', 'reviewing', 'needs_revision', 5, 1),
(6, '2026-06-10 01:42:00.000000', 'Upload v3 (đã thêm lower third)', NULL, NULL, 2, 1),
(7, '2026-06-09 02:00:00.000000', 'Upload v1', NULL, 'pending', 2, 2),
(8, '2026-06-09 03:30:00.000000', 'Bắt đầu review', 'pending', 'reviewing', 5, 2),
(9, '2026-06-03 02:00:00.000000', 'Upload v1', NULL, 'pending', 2, 3),
(10, '2026-06-04 07:20:00.000000', 'Bắt đầu review v1', 'pending', 'reviewing', 5, 3),
(11, '2026-06-04 08:00:00.000000', 'Yêu cầu sửa — âm thanh clip tại 03:20', 'reviewing', 'needs_revision', 5, 3),
(12, '2026-06-05 03:00:00.000000', 'Upload v2 (đã sửa)', NULL, NULL, 2, 3),
(13, '2026-06-05 09:30:00.000000', 'Approve — chuyển Duyệt cuối', 'reviewing', 'reviewed', 5, 3),
(14, '2026-06-01 02:00:00.000000', 'Upload v1', NULL, 'pending', 2, 4),
(15, '2026-06-02 03:00:00.000000', 'Review, không có lỗi', 'pending', 'reviewing', 5, 4),
(16, '2026-06-02 07:00:00.000000', 'Approve — chuyển Duyệt cuối', 'reviewing', 'reviewed', 5, 4),
(17, '2026-06-03 09:20:00.000000', 'Approve cuối — Published ✅', 'reviewed', 'approved', 6, 4),
(18, '2026-06-10 00:00:00.000000', 'Upload v1', NULL, 'pending', 3, 5),
(19, '2026-06-08 02:00:00.000000', 'Upload v1', NULL, 'pending', 3, 6),
(20, '2026-06-08 04:00:00.000000', 'Bắt đầu review', 'pending', 'reviewing', 7, 6),
(21, '2026-06-05 07:00:00.000000', 'Upload v1', NULL, 'pending', 3, 7),
(22, '2026-06-06 03:00:00.000000', 'Bắt đầu review', 'pending', 'reviewing', 5, 7),
(23, '2026-06-06 07:00:00.000000', 'Approve — chuyển Duyệt cuối', 'reviewing', 'reviewed', 5, 7),
(24, '2026-06-07 02:00:00.000000', 'Reject — Lý do: Chất lượng âm thanh quá kém, cần record lại', 'reviewed', 'rejected', 6, 7),
(25, '2026-06-16 19:07:04.602920', 'Upload v1 (Django Admin)', NULL, 'pending', 1, 8),
(26, '2026-06-16 19:23:54.772115', 'Bắt đầu review v1', 'pending', 'reviewing', 5, 8),
(27, '2026-06-16 19:24:09.900048', 'Yêu cầu sửa — fd', 'reviewing', 'needs_revision', 5, 8),
(28, '2026-06-16 19:26:39.168252', 'Upload v1', NULL, 'pending', 2, 9),
(29, '2026-06-16 19:27:06.015514', 'Bắt đầu review v1', 'pending', 'reviewing', 5, 9),
(30, '2026-06-16 19:27:09.108776', 'Approve review — chuyển Duyệt cuối', 'reviewing', 'reviewed', 5, 9),
(31, '2026-06-16 19:27:26.951018', 'Approve cuối — Published ✅', 'reviewed', 'approved', 6, 9),
(32, '2026-06-16 19:33:19.552254', 'Yêu cầu sửa — ttt', 'needs_revision', 'needs_revision', 5, 8),
(33, '2026-06-16 19:46:22.851708', 'Bắt đầu review v1', 'pending', 'reviewing', 5, 5),
(34, '2026-06-16 19:46:22.881801', 'Yêu cầu sửa — Can sua lai phan am thanh', 'reviewing', 'needs_revision', 5, 5),
(35, '2026-06-16 20:02:12.552865', 'Yêu cầu sửa — fff', 'needs_revision', 'needs_revision', 5, 8),
(36, '2026-06-16 20:03:43.653949', 'Upload v2 (re-upload)', 'needs_revision', 'reviewing', 8, 8),
(37, '2026-06-16 20:04:47.590218', 'Approve review — chuyển Duyệt cuối', 'reviewing', 'reviewed', 5, 8);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` bigint(20) NOT NULL,
  `type` varchar(20) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` longtext NOT NULL,
  `read` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `video_title` varchar(500) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `video_id` bigint(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `type`, `title`, `message`, `read`, `created_at`, `video_title`, `user_id`, `video_id`) VALUES
(1, 'comment', 'Comment mới', 'Nguyễn Thảo đã comment vào \"Hướng dẫn chụp ảnh chân dung\" — \"Đoạn này âm thanh bị rè...\"', 1, '2026-06-15 16:02:30.024240', 'Hướng dẫn chụp ảnh chân dung ngoài trời', 2, 1),
(2, 'mention', 'Được mention', 'Nguyễn Thảo đã mention bạn tại timestamp 04:32 trong \"Hướng dẫn chụp ảnh chân dung\"', 1, '2026-06-15 16:02:30.026491', 'Hướng dẫn chụp ảnh chân dung ngoài trời', 2, 1),
(3, 'upload', 'Video đang review', 'Video \"Review Sony ZV-E10 II\" chuyển sang trạng thái đang review', 1, '2026-06-15 16:02:30.028487', 'Review máy ảnh Sony ZV-E10 II — Full Test', 2, 2),
(4, 'approve', 'Video được duyệt', 'Video \"Cách chỉnh màu Lightroom\" đã được duyệt cuối approve ✅', 1, '2026-06-15 16:02:30.030316', 'Cách chỉnh màu Lightroom cho phong cảnh', 2, 4),
(5, 'upload', 'Re-upload mới', 'Hoàng Minh đã re-upload \"Hướng dẫn chụp ảnh chân dung\" → v3', 0, '2026-06-15 16:02:30.032105', 'Hướng dẫn chụp ảnh chân dung ngoài trời', 5, 1),
(6, 'upload', 'Video mới cần review', 'Video \"Review Sony ZV-E10 II\" đã upload, đang chờ bạn review', 0, '2026-06-15 16:02:30.033907', 'Review máy ảnh Sony ZV-E10 II — Full Test', 5, 2),
(7, 'timeout', '⚠️ Sắp timeout', '\"Hướng dẫn chụp ảnh chân dung\" còn 8 tiếng — hãy xử lý sớm!', 0, '2026-06-15 16:02:30.035739', 'Hướng dẫn chụp ảnh chân dung ngoài trời', 5, 1),
(8, 'approve', 'Video đã duyệt', 'Video \"Cách chỉnh màu Lightroom\" đã được duyệt cuối ✅', 1, '2026-06-15 16:02:30.037836', 'Cách chỉnh màu Lightroom cho phong cảnh', 5, 4),
(9, 'timeout', '⚠️ Timeout 7 ngày', '\"Top 5 ống kính kit 2025\" chưa được duyệt — Admin đã được notify.', 0, '2026-06-15 16:02:30.040321', 'Top 5 ống kính kit tốt nhất 2025', 6, 3),
(10, 'upload', 'Chờ quyết định', '\"Top 5 ống kính kit 2025\" đã được Reviewer approve, đang chờ quyết định cuối của bạn', 0, '2026-06-15 16:02:30.042587', 'Top 5 ống kính kit tốt nhất 2025', 6, 3),
(11, 'approve', 'Đã approve', 'Bạn đã approve \"Cách chỉnh màu Lightroom\" thành công', 1, '2026-06-15 16:02:30.045063', 'Cách chỉnh màu Lightroom cho phong cảnh', 6, 4),
(12, 'timeout', '🔴 Timeout 7 ngày', 'Phạm Long chưa duyệt \"Top 5 ống kính kit 2025\". Hãy liên hệ can thiệp.', 0, '2026-06-15 16:02:30.047301', 'Top 5 ống kính kit tốt nhất 2025', 1, 3),
(13, 'timeout', '🟡 Timeout 3 ngày', 'Nguyễn Thảo chưa review \"Hướng dẫn chụp ảnh chân dung\" — email nhắc đã gửi.', 0, '2026-06-15 16:02:30.050322', 'Hướng dẫn chụp ảnh chân dung ngoài trời', 1, 1),
(14, 'system', 'Cleanup hoàn thành', 'Cleanup thành công: 3 file cũ (_v1, _v2) đã xóa · tiết kiệm 4.2 GB', 1, '2026-06-15 16:02:30.052725', '', 1, NULL),
(15, 'comment', 'Comment mới', 'Admin System đã comment vào \"upload_phude\" — \"vidoe chất lượng thấp\"', 0, '2026-06-16 19:13:52.472017', 'upload_phude', 8, 8),
(16, 'upload', 'Video đang được review', 'Video \"upload_phude\" đã chuyển sang trạng thái đang review.', 0, '2026-06-16 19:23:54.774200', 'upload_phude', 8, 8),
(17, 'comment', 'Reviewer yêu cầu sửa lại', 'Reviewer Nguyễn Thảo yêu cầu sửa \"upload_phude\": fd', 0, '2026-06-16 19:24:09.903057', 'upload_phude', 8, 8),
(18, 'upload', 'Video mới cần review', 'Video \"t3wr\" đã upload, đang chờ review.', 0, '2026-06-16 19:26:39.171478', 't3wr', 5, 9),
(19, 'upload', 'Video mới cần review', 'Video \"t3wr\" đã upload, đang chờ review.', 0, '2026-06-16 19:26:39.172836', 't3wr', 7, 9),
(20, 'upload', 'Video đang được review', 'Video \"t3wr\" đã chuyển sang trạng thái đang review.', 1, '2026-06-16 19:27:06.017605', 't3wr', 2, 9),
(21, 'upload', 'Chờ quyết định', '\"t3wr\" đã được Reviewer approve, đang chờ quyết định cuối.', 0, '2026-06-16 19:27:09.113779', 't3wr', 6, 9),
(22, 'approve', 'Video được duyệt ✅', 'Video \"t3wr\" đã được duyệt cuối approve ✅', 0, '2026-06-16 19:27:26.953888', 't3wr', 2, 9),
(23, 'approve', 'Video đã duyệt', 'Video \"t3wr\" đã được duyệt cuối ✅', 0, '2026-06-16 19:27:26.955968', 't3wr', 5, 9),
(24, 'comment', 'Reviewer yêu cầu sửa lại', 'Reviewer Nguyễn Thảo yêu cầu sửa \"upload_phude\": ttt', 0, '2026-06-16 19:33:19.556602', 'upload_phude', 8, 8),
(25, 'upload', 'Video đang được review', 'Video \"Macro photography với kit lens — Chi tiết kỹ thuật\" đã chuyển sang trạng thái đang review.', 0, '2026-06-16 19:46:22.853470', 'Macro photography với kit lens — Chi tiết kỹ thuật', 3, 5),
(26, 'comment', 'Reviewer yêu cầu sửa lại', 'Reviewer Nguyễn Thảo yêu cầu sửa \"Macro photography với kit lens — Chi tiết kỹ thuật\": Can sua lai phan am thanh', 0, '2026-06-16 19:46:22.883735', 'Macro photography với kit lens — Chi tiết kỹ thuật', 3, 5),
(27, 'comment', 'Reviewer yêu cầu sửa lại', 'Reviewer Nguyễn Thảo yêu cầu sửa \"upload_phude\": fff', 0, '2026-06-16 20:02:12.557373', 'upload_phude', 8, 8),
(28, 'upload', 'Re-upload mới', 'Bùi Khoa đã re-upload \"upload_phude\" → v2', 0, '2026-06-16 20:03:43.655810', 'upload_phude', 5, 8),
(29, 'comment', 'Comment mới', 'Nguyễn Thảo đã comment vào \"upload_phude\" — \"ê\"', 0, '2026-06-16 20:04:25.702094', 'upload_phude', 8, 8),
(30, 'upload', 'Chờ quyết định', '\"upload_phude\" đã được Reviewer approve, đang chờ quyết định cuối.', 0, '2026-06-16 20:04:47.595192', 'upload_phude', 6, 8);

-- --------------------------------------------------------

--
-- Table structure for table `token_blacklist_blacklistedtoken`
--

CREATE TABLE `token_blacklist_blacklistedtoken` (
  `id` bigint(20) NOT NULL,
  `blacklisted_at` datetime(6) NOT NULL,
  `token_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `token_blacklist_blacklistedtoken`
--

INSERT INTO `token_blacklist_blacklistedtoken` (`id`, `blacklisted_at`, `token_id`) VALUES
(1, '2026-06-17 08:30:12.494833', 45);

-- --------------------------------------------------------

--
-- Table structure for table `token_blacklist_outstandingtoken`
--

CREATE TABLE `token_blacklist_outstandingtoken` (
  `id` bigint(20) NOT NULL,
  `token` longtext NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `expires_at` datetime(6) NOT NULL,
  `user_id` bigint(20) DEFAULT NULL,
  `jti` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `token_blacklist_outstandingtoken`
--

INSERT INTO `token_blacklist_outstandingtoken` (`id`, `token`, `created_at`, `expires_at`, `user_id`, `jti`) VALUES
(1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MjE4MzY5OCwiaWF0IjoxNzgxNTc4ODk4LCJqdGkiOiJhMDk0YTdiMzNkZTc0NmIxYjI2YzYzN2ZhODg2YTYzNyIsInVzZXJfaWQiOjF9.OtUjsvTDSWzfumbWexj-JapHOIEC5rI4vln6nJMKo-M', '2026-06-16 03:01:38.668401', '2026-06-23 03:01:38.000000', 1, 'a094a7b33de746b1b26c637fa886a637'),
(2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MjE4NDY0NiwiaWF0IjoxNzgxNTc5ODQ2LCJqdGkiOiI2MzE5ZmZjMzM5MjE0Y2RhODM2NTYwMDlkOGM0NjNmZSIsInVzZXJfaWQiOjF9.MdlEYTqXWG9bBNgSKCFVN3Lbbzgim5hTiPZ-yHiBmo8', '2026-06-16 03:17:26.121599', '2026-06-23 03:17:26.000000', 1, '6319ffc339214cda83656009d8c463fe'),
(3, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MjE4NDkwMiwiaWF0IjoxNzgxNTgwMTAyLCJqdGkiOiJjMmU1ZjM4NGM5Y2M0NjYyYjg5MWQyZmFjMGM2ZjQ3YyIsInVzZXJfaWQiOjF9.fQs2Gc-Tz5S2oibW7IV7G_zFoljCYKHsuTgb36FJmEY', '2026-06-16 03:21:42.561685', '2026-06-23 03:21:42.000000', 1, 'c2e5f384c9cc4662b891d2fac0c6f47c'),
(4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MjIxMDA4OCwiaWF0IjoxNzgxNjA1Mjg4LCJqdGkiOiIxZWU0NTQ3ZGYwNjY0MGE0YjEwZmM0ZTIxYWNmYWU1ZCIsInVzZXJfaWQiOjF9.JW_AFAD7q_kqwUa5MC9vSjthJpyHFNb6V-2d1C_nxm8', '2026-06-16 10:21:28.653175', '2026-06-23 10:21:28.000000', 1, '1ee4547df06640a4b10fc4e21acfae5d'),
(5, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MjIxMjgwNCwiaWF0IjoxNzgxNjA4MDA0LCJqdGkiOiJiMzcyMjliYTdhY2M0YzU1OGI2Mjk2YWFjOTA0Mjk1MiIsInVzZXJfaWQiOjF9.mOiZ2poXCOf13kKitBUeaOGWs6YAVVaohmiQqKkFoWQ', '2026-06-16 11:06:44.845456', '2026-06-23 11:06:44.000000', 1, 'b37229ba7acc4c558b6296aac9042952'),
(6, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MjIxNjk3MSwiaWF0IjoxNzgxNjEyMTcxLCJqdGkiOiIxYzk5YWY5OGE1YjM0OGMzOWQxNTk2OWNhN2NiMDA3MiIsInVzZXJfaWQiOjF9.ODQJO7TMDbv8BCvK_AocubYXLDYMRz2Z_063Oe-KgKM', '2026-06-16 12:16:11.060220', '2026-06-23 12:16:11.000000', 1, '1c99af98a5b348c39d15969ca7cb0072'),
(7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MjIxNjk3MSwiaWF0IjoxNzgxNjEyMTcxLCJqdGkiOiI1Mjg1NTQyZGU2ZDg0NzFkYTUzMjI4Yjc0NWFhM2RkZCIsInVzZXJfaWQiOjJ9.477ajRcJmHPh6UYi0mntw-4BZcwAdXRZ9OsdBRbRKJc', '2026-06-16 12:16:11.119886', '2026-06-23 12:16:11.000000', 2, '5285542de6d8471da53228b745aa3ddd'),
(8, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MjIxNjk3MSwiaWF0IjoxNzgxNjEyMTcxLCJqdGkiOiI2OWZjODc4YjI5ZTU0NmViOGJjY2E4MmJmYzBmYWRiZiIsInVzZXJfaWQiOjV9.o1_cZdiXmIzm93cAH46PcFhMxGtxALD3LFuAqMO6bVc', '2026-06-16 12:16:11.121366', '2026-06-23 12:16:11.000000', 5, '69fc878b29e546eb8bcca82bfc0fadbf'),
(9, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MjIxNzAwOSwiaWF0IjoxNzgxNjEyMjA5LCJqdGkiOiI3MzZkYTA2YThiZDk0YTdiYWIxZTZlYzFmYzg1OWY1YyIsInVzZXJfaWQiOjF9.zlTJj_pOd-n87NvXnoyb1GtwR6CyfdTuTFpsGRQ8Nhc', '2026-06-16 12:16:49.311713', '2026-06-23 12:16:49.000000', 1, '736da06a8bd94a7bab1e6ec1fc859f5c'),
(10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MjIxNzAwOSwiaWF0IjoxNzgxNjEyMjA5LCJqdGkiOiI1ZmM0YjNlMDQzOGI0MmFjOWI1ZWIxMThmZDY2NTYzMyIsInVzZXJfaWQiOjJ9.eYbA1ioc1hITHZtcDJ5CrxNswaZLp9nhczxKTLuzpiU', '2026-06-16 12:16:49.371668', '2026-06-23 12:16:49.000000', 2, '5fc4b3e0438b42ac9b5eb118fd665633'),
(11, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MjIxNzAwOSwiaWF0IjoxNzgxNjEyMjA5LCJqdGkiOiI1MTk5ODk4NWE1MTk0ZTM4YjJkYzk3NzRlYjZiY2JmMSIsInVzZXJfaWQiOjV9.iFduUZt9FfseaCYv-Y61d3yAwzt8HVvPOvOdr7ijrC0', '2026-06-16 12:16:49.373215', '2026-06-23 12:16:49.000000', 5, '51998985a5194e38b2dc9774eb6bcbf1'),
(12, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MjIxNzAwOSwiaWF0IjoxNzgxNjEyMjA5LCJqdGkiOiI2ZjBmYTcyOWE3ZDc0NjA3OGIxM2IxYWQ5NWY2ODVmMyIsInVzZXJfaWQiOjZ9.UDnqPh6P4VYFZ7BUhwa-9kBcC7lEhuRwZtiFOxB7Ad4', '2026-06-16 12:16:49.374294', '2026-06-23 12:16:49.000000', 6, '6f0fa729a7d746078b13b1ad95f685f3'),
(13, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MjIxNzA5NCwiaWF0IjoxNzgxNjEyMjk0LCJqdGkiOiI5MjdmNzVlMTMyY2I0NzVkOTlmMGIzNzFkOTBiMmViOCIsInVzZXJfaWQiOjJ9.sSKcyMb12YjmOMkAgEPLdiCw03UeukOxSvN6TEBMtUA', '2026-06-16 12:18:14.242445', '2026-06-23 12:18:14.000000', 2, '927f75e132cb475d99f0b371d90b2eb8'),
(14, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MjIxNzA5NCwiaWF0IjoxNzgxNjEyMjk0LCJqdGkiOiJhODM0NWQ4NTcxMjE0NmRhODJlMmU2MzZjMjZmMmIxNSIsInVzZXJfaWQiOjV9.TfXi4qUh3OsMyAFutEVMa4RUyYe3YqJeYx-uO0ljzk4', '2026-06-16 12:18:14.297529', '2026-06-23 12:18:14.000000', 5, 'a8345d85712146da82e2e636c26f2b15'),
(15, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MjIxNzEyNCwiaWF0IjoxNzgxNjEyMzI0LCJqdGkiOiJhNmE0ZWYzMzlmZGM0NWU3OTk0OWZiMmI2NDY0MmRiZSIsInVzZXJfaWQiOjF9.IWVwZmFhx9oEYyIA0Zt8J7tpEYVeFU5tjWRk6zQ7hRw', '2026-06-16 12:18:44.045587', '2026-06-23 12:18:44.000000', 1, 'a6a4ef339fdc45e79949fb2b64642dbe'),
(16, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MjIxNzEyNCwiaWF0IjoxNzgxNjEyMzI0LCJqdGkiOiJkN2MyYTBjODNhZjM0ZTIzOTFkY2JmYmJhMzRiYTZlZSIsInVzZXJfaWQiOjJ9.E7AA1ZLQqqjwS4iaz6Wr-j0p5fJ8v_MEIP1x-hIf6S8', '2026-06-16 12:18:44.102372', '2026-06-23 12:18:44.000000', 2, 'd7c2a0c83af34e2391dcbfbba34ba6ee'),
(17, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MjIxNzEyNCwiaWF0IjoxNzgxNjEyMzI0LCJqdGkiOiI5NjYyMDM0ODllZWQ0YWZkOGYyYTFkMDFhNDk3YzBlZCIsInVzZXJfaWQiOjV9.N555e0UvDjhOf0pFvIGsX4rWrJjlbhvUDClcgoNLPKQ', '2026-06-16 12:18:44.103642', '2026-06-23 12:18:44.000000', 5, '966203489eed4afd8f2a1d01a497c0ed'),
(18, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MjIxNzEyNCwiaWF0IjoxNzgxNjEyMzI0LCJqdGkiOiI2N2U3M2FlZjI1MzQ0ZjU1YmZkY2E5YjRiMDhmNGI0OSIsInVzZXJfaWQiOjZ9.kk4c26Vt3G0JRn3Bu7tljhpclptcyh44c08eShHoJKk', '2026-06-16 12:18:44.104812', '2026-06-23 12:18:44.000000', 6, '67e73aef25344f55bfdca9b4b08f4b49'),
(19, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MjIxNzIzNiwiaWF0IjoxNzgxNjEyNDM2LCJqdGkiOiIxODlkMjhlZDVmNWE0ODM1ODE0OWM3NjlhODZhNDdmMCIsInVzZXJfaWQiOjF9.YOrv9AMK5AVwU0Ni5lgoBx03y2dSP6xP6c4T9Mx4jik', '2026-06-16 12:20:36.540459', '2026-06-23 12:20:36.000000', 1, '189d28ed5f5a48358149c769a86a47f0'),
(20, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MjIxNzIzNiwiaWF0IjoxNzgxNjEyNDM2LCJqdGkiOiI2NjZjNDU1OWM0YzM0YTY2OTQ0ZTQzZWQxMGZiY2IyOCIsInVzZXJfaWQiOjJ9.wLxNGCGuGFhGTLu5bBc9_ZJBEkZx7iQuuTq6295ATzM', '2026-06-16 12:20:36.598632', '2026-06-23 12:20:36.000000', 2, '666c4559c4c34a66944e43ed10fbcb28'),
(21, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MjIxNzIzNiwiaWF0IjoxNzgxNjEyNDM2LCJqdGkiOiIyOWVmYTM0ZGFkOTE0MjFkOTcyYTEwYzRlNGVkMzFlZiIsInVzZXJfaWQiOjV9.UZKroQ4n9eui-aW6_wR8ymPMnJ1tTuUWlYS6WOZhqC0', '2026-06-16 12:20:36.599962', '2026-06-23 12:20:36.000000', 5, '29efa34dad91421d972a10c4e4ed31ef'),
(22, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MjIxNzIzNiwiaWF0IjoxNzgxNjEyNDM2LCJqdGkiOiIxNmE2YWFmNWM0YjY0NjMyODg5ZTdiZmQ5NmQyMWJkYiIsInVzZXJfaWQiOjZ9.4ZeDcmtnpSFTwc4qibM6hyFeQosmLiJ5uW21HNJBT0s', '2026-06-16 12:20:36.601200', '2026-06-23 12:20:36.000000', 6, '16a6aaf5c4b64632889e7bfd96d21bdb'),
(23, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MjIxNzIzNywiaWF0IjoxNzgxNjEyNDM3LCJqdGkiOiI5MGY5ZWM1MzZhNWE0Nzg2Yjk5NzcwOTA0YzRjZmM4ZCIsInVzZXJfaWQiOjF9.USiU49cVpg4_K3ECdL3AQf2qROz1lS-3KmWHXfU-ZzU', '2026-06-16 12:20:37.040066', '2026-06-23 12:20:37.000000', 1, '90f9ec536a5a4786b99770904c4cfc8d'),
(24, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MjIxNzMxOCwiaWF0IjoxNzgxNjEyNTE4LCJqdGkiOiIwNjVlNjk1OTBkZDk0MmU4ODFkNmIyNTRhMmQ2NTZkZCIsInVzZXJfaWQiOjV9.OrDQRnzW3nWg1Rsahq4ePf1JP1NYfw6RGoxnH2jBqNo', '2026-06-16 12:21:58.155080', '2026-06-23 12:21:58.000000', 5, '065e69590dd942e881d6b254a2d656dd'),
(25, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MjIxNzMxOCwiaWF0IjoxNzgxNjEyNTE4LCJqdGkiOiJjNGNiNWRjNGI0M2Q0ZThkOTJkNWZhODQ2YWEzNTU1MCIsInVzZXJfaWQiOjJ9.WJ7uPTtupYX2ntDN3N4YO6iWDe0SYMs1vskGtr8NL1Y', '2026-06-16 12:21:58.211132', '2026-06-23 12:21:58.000000', 2, 'c4cb5dc4b43d4e8d92d5fa846aa35550'),
(26, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MjIxNzQyMSwiaWF0IjoxNzgxNjEyNjIxLCJqdGkiOiJhODAxMGM4NzBiYTM0MGNkODdjMzM5MjVhYTViYjI0MyIsInVzZXJfaWQiOjV9.J9XsYgkujfRJuaUAtcz402ELiIit_TkJ3nEzykWd2Z0', '2026-06-16 12:23:41.046719', '2026-06-23 12:23:41.000000', 5, 'a8010c870ba340cd87c33925aa5bb243'),
(27, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MjIxNzQ1OSwiaWF0IjoxNzgxNjEyNjU5LCJqdGkiOiI5MDgwNGJjNDU1MjA0NmI2ODlhMWM5NTYwOWQyZGZlYSIsInVzZXJfaWQiOjJ9.iGwzo-CyTZzBI-lMHv92Gzm85Gg-8G_2YOTCG5mqt_Q', '2026-06-16 12:24:19.257775', '2026-06-23 12:24:19.000000', 2, '90804bc4552046b689a1c95609d2dfea'),
(28, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MjIxNzYxNSwiaWF0IjoxNzgxNjEyODE1LCJqdGkiOiJhOTk4NmRhNDNjMWU0NDVmOWZlYTVkODM4YWFmYzRlYSIsInVzZXJfaWQiOjV9.vzXpUI34aYUayBTYLlMMM6OzsRViJyB7Oi4IF869sHk', '2026-06-16 12:26:55.268270', '2026-06-23 12:26:55.000000', 5, 'a9986da43c1e445f9fea5d838aafc4ea'),
(29, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MjIxNzYzOSwiaWF0IjoxNzgxNjEyODM5LCJqdGkiOiIxOTIwNDVkMjBhNGE0N2IzOWIyOWFmMTYyNjhmODY2OSIsInVzZXJfaWQiOjZ9.e-Yilf0iaJvyh5WwWW8_VmeJGlR0PSm7a8VNk3sVXFI', '2026-06-16 12:27:19.410529', '2026-06-23 12:27:19.000000', 6, '192045d20a4a47b39b29af16268f8669'),
(30, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MjIxNzY2MiwiaWF0IjoxNzgxNjEyODYyLCJqdGkiOiIyMzUwODYzOTEzZGY0ZWRlODlhYjM3OGY5ZjdhMjM3YSIsInVzZXJfaWQiOjV9.o0iir0PeIOAJI0ZONFBxV-Wy23WONS89P9Vlw7Iz_WI', '2026-06-16 12:27:42.271583', '2026-06-23 12:27:42.000000', 5, '2350863913df4ede89ab378f9f7a237a'),
(31, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MjIxNzY3MCwiaWF0IjoxNzgxNjEyODcwLCJqdGkiOiIyNjQ3NmQwMGMzYTA0N2VhYWM0NjIxMTE0MGZiYThlZCIsInVzZXJfaWQiOjJ9.U3yGbKGzW0nxtFjPKCnxLKjR0BlcUDjRdEoVtnH3Eic', '2026-06-16 12:27:50.425163', '2026-06-23 12:27:50.000000', 2, '26476d00c3a047eaac46211140fba8ed'),
(32, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MjIxNzk3MywiaWF0IjoxNzgxNjEzMTczLCJqdGkiOiIwZTU3ZGU2M2EyOGU0ZTg5OWFjM2M1N2Q5OWQzY2UxMCIsInVzZXJfaWQiOjJ9.-R8q4DhemGblDNhKqkSwG1cKB9WCHnqZgfrZRnan_QE', '2026-06-16 12:32:53.707421', '2026-06-23 12:32:53.000000', 2, '0e57de63a28e4e899ac3c57d99d3ce10'),
(33, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MjIxNzk3OSwiaWF0IjoxNzgxNjEzMTc5LCJqdGkiOiI5NGU5YzZjNzVjMDI0N2I3YmFkMGI0MjYxNGFiOTBlNiIsInVzZXJfaWQiOjV9.-1Vii8PEBERsQOjNAU0A4mTWjUmU1hCYYBsxJhO38xU', '2026-06-16 12:32:59.997432', '2026-06-23 12:32:59.000000', 5, '94e9c6c75c0247b7bad0b42614ab90e6'),
(34, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MjIxODAwNCwiaWF0IjoxNzgxNjEzMjA0LCJqdGkiOiJiMjkyNWE2MDVhNjc0ODY2YTM5YjdiNzRkNTRjNTZkOCIsInVzZXJfaWQiOjJ9.bpoix-zmjGozElTA-N1BDJMIfY3zezaLXbHO6JdUOJE', '2026-06-16 12:33:24.277311', '2026-06-23 12:33:24.000000', 2, 'b2925a605a674866a39b7b74d54c56d8'),
(35, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MjIxODQ2MiwiaWF0IjoxNzgxNjEzNjYyLCJqdGkiOiI2MzIwYjMxZjE5MzM0MDUwODZhMGU5MmYzMjQzZTQ0NiIsInVzZXJfaWQiOjh9.3uInZ3T9y106iB_oEpATeWUT9fOfzGoFWu7ZzQ2zfXY', '2026-06-16 12:41:02.412845', '2026-06-23 12:41:02.000000', 8, '6320b31f1933405086a0e92f3243e446'),
(36, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MjIxODQ2MiwiaWF0IjoxNzgxNjEzNjYyLCJqdGkiOiJmZGUzZDg2YjI4YjY0YmY3YjQxMjhiOTY5ZGIyZjQ2OSIsInVzZXJfaWQiOjV9.HYSCeLthhcCNBLGV24p3CIf8RlTGFW4hvR-rGs9VF4g', '2026-06-16 12:41:02.472036', '2026-06-23 12:41:02.000000', 5, 'fde3d86b28b64bf7b4128b969db2f469'),
(37, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MjIxODc0NywiaWF0IjoxNzgxNjEzOTQ3LCJqdGkiOiIxMWUzZDU0MmQ5MzQ0NWNlYTI0NTc5ZTNiYzRlOWE3NiIsInVzZXJfaWQiOjJ9.Etsz6L7HJ0exZKi_8UoHWYMAR9EhdEqRRQ-YX3khoc4', '2026-06-16 12:45:47.042739', '2026-06-23 12:45:47.000000', 2, '11e3d542d93445cea24579e3bc4e9a76'),
(38, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MjIxODc0NywiaWF0IjoxNzgxNjEzOTQ3LCJqdGkiOiJjN2MwYzBlMmMwYzE0MzQzOGFiMmJjOTUzYWIwOThjOCIsInVzZXJfaWQiOjV9.1WtdRIMuzRc9stgKE7cdAxHujJeHJ2tyquhYTdH92jo', '2026-06-16 12:45:47.110134', '2026-06-23 12:45:47.000000', 5, 'c7c0c0e2c0c143438ab2bc953ab098c8'),
(39, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MjIxODc4MiwiaWF0IjoxNzgxNjEzOTgyLCJqdGkiOiIxMTA5MWNhMjNiNjA0MmExODU4MGU4NWY5YzJlMDA0NiIsInVzZXJfaWQiOjN9.gqHZ5AnjXq7v1ridUANP3vi9ZDANr9ZWHv0_xsBVW7U', '2026-06-16 12:46:22.741459', '2026-06-23 12:46:22.000000', 3, '11091ca23b6042a18580e85f9c2e0046'),
(40, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MjIxODc4MiwiaWF0IjoxNzgxNjEzOTgyLCJqdGkiOiIxODgxN2I1M2M1N2Q0YmMzYjZlNzQ3MDhjYjE5NTYyZSIsInVzZXJfaWQiOjV9.aMZa1Iiw9-e2pNz8I2OkwUbJn1HJu_OWCnfQLDQ96zk', '2026-06-16 12:46:22.800786', '2026-06-23 12:46:22.000000', 5, '18817b53c57d4bc3b6e74708cb19562e'),
(41, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MjIxOTYyNSwiaWF0IjoxNzgxNjE0ODI1LCJqdGkiOiI5MWI5ODRiMWNmZjI0ZTdiOTVjOTZhYTc5YzMxMGNmMCIsInVzZXJfaWQiOjJ9.4Iunkvqq_EKxJI4ilaHv5bn80FeyUbuIpY5bliOKVg4', '2026-06-16 13:00:25.501038', '2026-06-23 13:00:25.000000', 2, '91b984b1cff24e7b95c96aa79c310cf0'),
(42, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MjIxOTY4MCwiaWF0IjoxNzgxNjE0ODgwLCJqdGkiOiJiN2NmYjU1Mjc0ODg0ZDE1OTdlNDcyMjAwODljNTk2MSIsInVzZXJfaWQiOjV9.9Avu_5ZIb0sLM96HlcQB_z6xyFApvJvMhHn5flOlotE', '2026-06-16 13:01:20.977217', '2026-06-23 13:01:20.000000', 5, 'b7cfb55274884d1597e47220089c5961'),
(43, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MjIxOTc0NCwiaWF0IjoxNzgxNjE0OTQ0LCJqdGkiOiI3NjViNzk1MzQwNjY0MDVjYTU3NWRjMWIyOWYzMDhlMyIsInVzZXJfaWQiOjJ9.5DBoSdO1dHMMpscIqTWriOwBZBMVsp7vGN8ymNqlZBY', '2026-06-16 13:02:24.659138', '2026-06-23 13:02:24.000000', 2, '765b79534066405ca575dc1b29f308e3'),
(44, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MjIxOTc3MCwiaWF0IjoxNzgxNjE0OTcwLCJqdGkiOiIxYWIyMjc1NjNlOTA0ZjUwOWY3NWYxZGE0ZDBjZGI3NyIsInVzZXJfaWQiOjh9.C4_Y_8efQ01UzaN4syvclQdbAipXhokFJR940v2WC2s', '2026-06-16 13:02:50.939221', '2026-06-23 13:02:50.000000', 8, '1ab227563e904f509f75f1da4d0cdb77'),
(45, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MjIxOTgzMCwiaWF0IjoxNzgxNjE1MDMwLCJqdGkiOiJlYzQyNGQ2MGZiY2Y0YzE0YTRhYTU5MWNlODU5YTg2NSIsInVzZXJfaWQiOjV9.Xp2H0yIlGInpWfMIMss8Sjg0TuwJVPpK4tdHtqmjd9I', '2026-06-16 13:03:50.174748', '2026-06-23 13:03:50.000000', 5, 'ec424d60fbcf4c14a4aa591ce859a865');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) NOT NULL,
  `password` varchar(128) NOT NULL,
  `last_login` datetime(6) DEFAULT NULL,
  `is_superuser` tinyint(1) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(254) NOT NULL,
  `role` varchar(20) NOT NULL,
  `initials` varchar(3) NOT NULL,
  `avatar_bg` varchar(20) NOT NULL,
  `avatar_color` varchar(20) NOT NULL,
  `locked` tinyint(1) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `is_staff` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `password`, `last_login`, `is_superuser`, `name`, `email`, `role`, `initials`, `avatar_bg`, `avatar_color`, `locked`, `is_active`, `is_staff`, `created_at`) VALUES
(1, 'pbkdf2_sha256$720000$28QfXNWP9mme0oLx9EhBGL$Wr1sqBI9nU9wkOpkG9EAgBUC9A5KlHRIhvAVS2igUbM=', '2026-06-16 10:51:59.810946', 1, 'Admin System', 'admin@encycam.vn', 'admin', 'AD', '#f3e8ff', '#7c3aed', 0, 1, 1, '2026-06-15 16:02:26.623436'),
(2, 'pbkdf2_sha256$720000$OAa0zM3MEn94wzV2laVdgx$L/NULOD2nSAZFXNHcL/b5tlz0XLsGcah3gIK8KL0U1U=', NULL, 0, 'Hoàng Minh', 'hminh@encycam.vn', 'btv', 'HM', '#dbeafe', '#1d4ed8', 0, 1, 0, '2026-06-15 16:02:27.034678'),
(3, 'pbkdf2_sha256$720000$bafoQNF0oSYzr4TvlzhwO8$VEFaMPXL4SaUbpMXsncAaGkQPZflrBhoVTPXEqthamg=', NULL, 0, 'Trần Phú', 'tphu@encycam.vn', 'btv', 'TP', '#dcfce7', '#15803d', 0, 1, 0, '2026-06-15 16:02:27.424787'),
(4, 'pbkdf2_sha256$720000$ZG4YdwVKXRoLIhLn5md3yt$gITQXR+PrJTShN/xJhXHxApfXM6IdmvGNgJDOrO5Umw=', NULL, 0, 'Lê Tuấn', 'ltuan@encycam.vn', 'btv', 'LT', '#fce7f3', '#be185d', 1, 1, 0, '2026-06-15 16:02:27.884652'),
(5, 'pbkdf2_sha256$720000$kIQrQUDGMab80cG7BxV8Mw$eFcQWE8AcE96N9ttr2vE7kiOUwc8K9IKBKubNsK/6Zo=', NULL, 0, 'Nguyễn Thảo', 'nthao@encycam.vn', 'reviewer', 'NT', '#dcfce7', '#16a34a', 0, 1, 0, '2026-06-15 16:02:28.285914'),
(6, 'pbkdf2_sha256$720000$D69NuVi34O8aOAmlplhqSI$mEY1gd8IaGyRo16DaY48YKGoWLIV+Ljk4Lc9PX/gE4M=', NULL, 0, 'Phạm Long', 'plong@encycam.vn', 'final', 'PL', '#ffedd5', '#ea580c', 0, 1, 0, '2026-06-15 16:02:28.683603'),
(7, 'pbkdf2_sha256$720000$WZbeZ6YvCKHJOCME0nzeey$YFQ9NCuEvs+/TVkSNmgGPghvIcoGa0+VgDtj28pwVTg=', NULL, 0, 'Mai Hương', 'mhuong@encycam.vn', 'reviewer', 'MH', '#ede9fe', '#7c3aed', 0, 1, 0, '2026-06-15 16:02:29.075133'),
(8, 'pbkdf2_sha256$720000$3h1RLDvGLrNxlwJovRdM3D$VOqo7ItFWOwQk5nQr5OftXPBf6oQ6g0WetyOFhMA81U=', NULL, 0, 'Bùi Khoa', 'bkhoa@encycam.vn', 'btv', 'BK', '#fef9c3', '#a16207', 0, 1, 0, '2026-06-15 16:02:29.470779');

-- --------------------------------------------------------

--
-- Table structure for table `users_groups`
--

CREATE TABLE `users_groups` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `group_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users_user_permissions`
--

CREATE TABLE `users_user_permissions` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `permission_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `videos`
--

CREATE TABLE `videos` (
  `id` bigint(20) NOT NULL,
  `title` varchar(500) NOT NULL,
  `file_id` varchar(50) NOT NULL,
  `status` varchar(30) NOT NULL,
  `current_version` int(10) UNSIGNED NOT NULL CHECK (`current_version` >= 0),
  `uploaded_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `notes` longtext NOT NULL,
  `thumb_gradient` varchar(100) NOT NULL,
  `category` varchar(50) NOT NULL,
  `btv_id` bigint(20) NOT NULL,
  `reviewer_id` bigint(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `videos`
--

INSERT INTO `videos` (`id`, `title`, `file_id`, `status`, `current_version`, `uploaded_at`, `updated_at`, `notes`, `thumb_gradient`, `category`, `btv_id`, `reviewer_id`) VALUES
(1, 'Hướng dẫn chụp ảnh chân dung ngoài trời', 'VideoID_2413', 'needs_revision', 3, '2026-06-03 02:00:00.000000', '2026-06-15 16:02:29.896752', 'Video hướng dẫn kỹ thuật chụp chân dung outdoor, ánh sáng tự nhiên', 'from-blue-500 to-purple-600', 'Tutorial', 2, 5),
(2, 'Review máy ảnh Sony ZV-E10 II — Full Test', 'VideoID_2410', 'reviewing', 1, '2026-06-09 02:00:00.000000', '2026-06-15 16:02:29.900894', '', 'from-slate-600 to-slate-800', 'Review', 2, 5),
(3, 'Top 5 ống kính kit tốt nhất 2025', 'VideoID_2408', 'reviewed', 2, '2026-06-03 02:00:00.000000', '2026-06-15 16:02:29.903967', '', 'from-amber-500 to-orange-600', 'Comparison', 2, 5),
(4, 'Cách chỉnh màu Lightroom cho phong cảnh', 'VideoID_2401', 'approved', 1, '2026-06-01 02:00:00.000000', '2026-06-15 16:02:29.908245', '', 'from-green-400 to-teal-500', 'Tutorial', 2, 5),
(5, 'Macro photography với kit lens — Chi tiết kỹ thuật', 'VideoID_2399', 'needs_revision', 1, '2026-06-10 00:00:00.000000', '2026-06-16 19:46:22.880658', '', 'from-rose-400 to-pink-600', 'Tutorial', 3, 5),
(6, 'Chụp ảnh đường phố ban đêm — Street Photography', 'VideoID_2397', 'reviewing', 1, '2026-06-08 02:00:00.000000', '2026-06-15 16:02:29.916040', '', 'from-indigo-600 to-violet-700', 'Tutorial', 3, 7),
(7, 'Gear Review: Tripod Sirui 3T-35K — Có nên mua?', 'VideoID_2395', 'rejected', 1, '2026-06-05 07:00:00.000000', '2026-06-15 16:02:29.920089', '', 'from-red-400 to-rose-600', 'Review', 3, 5),
(8, 'upload_phude', 'VideoID_2008', 'reviewed', 2, '2026-06-16 19:07:04.500078', '2026-06-16 20:04:47.587835', 'abcdef', 'from-cyan-500 to-blue-600', 'Review', 8, 5),
(9, 't3wr', 'VideoID_2009', 'approved', 1, '2026-06-16 19:26:39.068082', '2026-06-16 19:27:26.948971', 'ưewe', 'from-amber-500 to-orange-600', 'Tutorial', 2, 5);

-- --------------------------------------------------------

--
-- Table structure for table `video_versions`
--

CREATE TABLE `video_versions` (
  `id` bigint(20) NOT NULL,
  `number` int(10) UNSIGNED NOT NULL CHECK (`number` >= 0),
  `uploaded_at` datetime(6) NOT NULL,
  `file` varchar(100) DEFAULT NULL,
  `file_size` varchar(50) NOT NULL,
  `duration` varchar(20) NOT NULL,
  `uploaded_by_id` bigint(20) NOT NULL,
  `video_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `video_versions`
--

INSERT INTO `video_versions` (`id`, `number`, `uploaded_at`, `file`, `file_size`, `duration`, `uploaded_by_id`, `video_id`) VALUES
(1, 1, '2026-06-03 02:00:00.000000', '', '1.2 GB', '8:24', 2, 1),
(2, 2, '2026-06-05 01:00:00.000000', '', '1.1 GB', '8:18', 2, 1),
(3, 3, '2026-06-10 01:42:00.000000', '', '1.15 GB', '8:20', 2, 1),
(4, 1, '2026-06-09 02:00:00.000000', '', '2.3 GB', '15:02', 2, 2),
(5, 1, '2026-06-03 02:00:00.000000', '', '1.8 GB', '11:37', 2, 3),
(6, 2, '2026-06-05 03:00:00.000000', '', '1.75 GB', '11:30', 2, 3),
(7, 1, '2026-06-01 02:00:00.000000', '', '980 MB', '9:15', 2, 4),
(8, 1, '2026-06-10 00:00:00.000000', '', '750 MB', '6:48', 3, 5),
(9, 1, '2026-06-08 02:00:00.000000', '', '1.4 GB', '12:10', 3, 6),
(10, 1, '2026-06-05 07:00:00.000000', '', '890 MB', '7:22', 3, 7),
(11, 1, '2026-06-16 19:07:04.502752', 'videos/upload_phudemoi.mp4', '79 MB', '—', 1, 8),
(12, 1, '2026-06-16 19:26:39.072719', 'videos/upload_phudemoi_tFXRH84.mp4', '79 MB', '—', 2, 9),
(13, 2, '2026-06-16 20:03:43.559936', 'videos/upload_phudemoi_XES1khy.mp4', '79 MB', '—', 8, 8);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `audit_log`
--
ALTER TABLE `audit_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `audit_log_user_id_a1b3392d_fk_users_id` (`user_id`);

--
-- Indexes for table `auth_group`
--
ALTER TABLE `auth_group`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `auth_group_permissions`
--
ALTER TABLE `auth_group_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `auth_group_permissions_group_id_permission_id_0cd325b0_uniq` (`group_id`,`permission_id`),
  ADD KEY `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` (`permission_id`);

--
-- Indexes for table `auth_permission`
--
ALTER TABLE `auth_permission`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `auth_permission_content_type_id_codename_01ab375a_uniq` (`content_type_id`,`codename`);

--
-- Indexes for table `comments`
--
ALTER TABLE `comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `comments_user_id_b8fd0b64_fk_users_id` (`user_id`),
  ADD KEY `comments_video_id_ed285ab3_fk_videos_id` (`video_id`);

--
-- Indexes for table `django_admin_log`
--
ALTER TABLE `django_admin_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `django_admin_log_content_type_id_c4bce8eb_fk_django_co` (`content_type_id`),
  ADD KEY `django_admin_log_user_id_c564eba6_fk_users_id` (`user_id`);

--
-- Indexes for table `django_content_type`
--
ALTER TABLE `django_content_type`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `django_content_type_app_label_model_76bd3d3b_uniq` (`app_label`,`model`);

--
-- Indexes for table `django_migrations`
--
ALTER TABLE `django_migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `django_session`
--
ALTER TABLE `django_session`
  ADD PRIMARY KEY (`session_key`),
  ADD KEY `django_session_expire_date_a5c62663` (`expire_date`);

--
-- Indexes for table `history_entries`
--
ALTER TABLE `history_entries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `history_entries_user_id_1c6cd1fd_fk_users_id` (`user_id`),
  ADD KEY `history_entries_video_id_dba343ab_fk_videos_id` (`video_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `notifications_user_id_468e288d_fk_users_id` (`user_id`),
  ADD KEY `notifications_video_id_cd70621f_fk_videos_id` (`video_id`);

--
-- Indexes for table `token_blacklist_blacklistedtoken`
--
ALTER TABLE `token_blacklist_blacklistedtoken`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token_id` (`token_id`);

--
-- Indexes for table `token_blacklist_outstandingtoken`
--
ALTER TABLE `token_blacklist_outstandingtoken`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token_blacklist_outstandingtoken_jti_hex_d9bdf6f7_uniq` (`jti`),
  ADD KEY `token_blacklist_outstandingtoken_user_id_83bc629a_fk_users_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `users_groups`
--
ALTER TABLE `users_groups`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_groups_user_id_group_id_fc7788e8_uniq` (`user_id`,`group_id`),
  ADD KEY `users_groups_group_id_2f3517aa_fk_auth_group_id` (`group_id`);

--
-- Indexes for table `users_user_permissions`
--
ALTER TABLE `users_user_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_user_permissions_user_id_permission_id_3b86cbdf_uniq` (`user_id`,`permission_id`),
  ADD KEY `users_user_permissio_permission_id_6d08dcd2_fk_auth_perm` (`permission_id`);

--
-- Indexes for table `videos`
--
ALTER TABLE `videos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `file_id` (`file_id`),
  ADD KEY `videos_btv_id_ae8da12d_fk_users_id` (`btv_id`),
  ADD KEY `videos_reviewer_id_1556e0fe_fk_users_id` (`reviewer_id`);

--
-- Indexes for table `video_versions`
--
ALTER TABLE `video_versions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `video_versions_video_id_number_c0912721_uniq` (`video_id`,`number`),
  ADD KEY `video_versions_uploaded_by_id_b2dc6e5c_fk_users_id` (`uploaded_by_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `audit_log`
--
ALTER TABLE `audit_log`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT for table `auth_group`
--
ALTER TABLE `auth_group`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `auth_group_permissions`
--
ALTER TABLE `auth_group_permissions`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `auth_permission`
--
ALTER TABLE `auth_permission`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=57;

--
-- AUTO_INCREMENT for table `comments`
--
ALTER TABLE `comments`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `django_admin_log`
--
ALTER TABLE `django_admin_log`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `django_content_type`
--
ALTER TABLE `django_content_type`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `django_migrations`
--
ALTER TABLE `django_migrations`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT for table `history_entries`
--
ALTER TABLE `history_entries`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `token_blacklist_blacklistedtoken`
--
ALTER TABLE `token_blacklist_blacklistedtoken`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `token_blacklist_outstandingtoken`
--
ALTER TABLE `token_blacklist_outstandingtoken`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `users_groups`
--
ALTER TABLE `users_groups`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users_user_permissions`
--
ALTER TABLE `users_user_permissions`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `videos`
--
ALTER TABLE `videos`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `video_versions`
--
ALTER TABLE `video_versions`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `audit_log`
--
ALTER TABLE `audit_log`
  ADD CONSTRAINT `audit_log_user_id_a1b3392d_fk_users_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `auth_group_permissions`
--
ALTER TABLE `auth_group_permissions`
  ADD CONSTRAINT `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  ADD CONSTRAINT `auth_group_permissions_group_id_b120cbf9_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`);

--
-- Constraints for table `auth_permission`
--
ALTER TABLE `auth_permission`
  ADD CONSTRAINT `auth_permission_content_type_id_2f476e4b_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`);

--
-- Constraints for table `comments`
--
ALTER TABLE `comments`
  ADD CONSTRAINT `comments_user_id_b8fd0b64_fk_users_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `comments_video_id_ed285ab3_fk_videos_id` FOREIGN KEY (`video_id`) REFERENCES `videos` (`id`);

--
-- Constraints for table `django_admin_log`
--
ALTER TABLE `django_admin_log`
  ADD CONSTRAINT `django_admin_log_content_type_id_c4bce8eb_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`),
  ADD CONSTRAINT `django_admin_log_user_id_c564eba6_fk_users_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `history_entries`
--
ALTER TABLE `history_entries`
  ADD CONSTRAINT `history_entries_user_id_1c6cd1fd_fk_users_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `history_entries_video_id_dba343ab_fk_videos_id` FOREIGN KEY (`video_id`) REFERENCES `videos` (`id`);

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_user_id_468e288d_fk_users_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `notifications_video_id_cd70621f_fk_videos_id` FOREIGN KEY (`video_id`) REFERENCES `videos` (`id`);

--
-- Constraints for table `token_blacklist_blacklistedtoken`
--
ALTER TABLE `token_blacklist_blacklistedtoken`
  ADD CONSTRAINT `token_blacklist_blacklistedtoken_token_id_3cc7fe56_fk` FOREIGN KEY (`token_id`) REFERENCES `token_blacklist_outstandingtoken` (`id`);

--
-- Constraints for table `token_blacklist_outstandingtoken`
--
ALTER TABLE `token_blacklist_outstandingtoken`
  ADD CONSTRAINT `token_blacklist_outstandingtoken_user_id_83bc629a_fk_users_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `users_groups`
--
ALTER TABLE `users_groups`
  ADD CONSTRAINT `users_groups_group_id_2f3517aa_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`),
  ADD CONSTRAINT `users_groups_user_id_f500bee5_fk_users_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `users_user_permissions`
--
ALTER TABLE `users_user_permissions`
  ADD CONSTRAINT `users_user_permissio_permission_id_6d08dcd2_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  ADD CONSTRAINT `users_user_permissions_user_id_92473840_fk_users_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `videos`
--
ALTER TABLE `videos`
  ADD CONSTRAINT `videos_btv_id_ae8da12d_fk_users_id` FOREIGN KEY (`btv_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `videos_reviewer_id_1556e0fe_fk_users_id` FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `video_versions`
--
ALTER TABLE `video_versions`
  ADD CONSTRAINT `video_versions_uploaded_by_id_b2dc6e5c_fk_users_id` FOREIGN KEY (`uploaded_by_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `video_versions_video_id_0922e771_fk_videos_id` FOREIGN KEY (`video_id`) REFERENCES `videos` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
