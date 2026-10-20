--
-- PostgreSQL database dump
--

\restrict YK9Hsu6acqOYogWrw3LxjK1Rf0ZnBe2ehMnBGXFab3fF7AW0mexqU1eaF2BNnWM

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: academic_courses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.academic_courses (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.academic_courses OWNER TO postgres;

--
-- Name: academic_courses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.academic_courses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.academic_courses_id_seq OWNER TO postgres;

--
-- Name: academic_courses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.academic_courses_id_seq OWNED BY public.academic_courses.id;


--
-- Name: assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assignments (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    teacher_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.assignments OWNER TO postgres;

--
-- Name: assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assignments_id_seq OWNER TO postgres;

--
-- Name: assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assignments_id_seq OWNED BY public.assignments.id;


--
-- Name: batches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.batches (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    exam_id integer NOT NULL,
    target_year integer NOT NULL,
    status character varying(50) DEFAULT 'upcoming'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    start_date date,
    end_date date,
    CONSTRAINT batches_status_check CHECK (((status)::text = ANY (ARRAY[('active'::character varying)::text, ('upcoming'::character varying)::text, ('completed'::character varying)::text])))
);


ALTER TABLE public.batches OWNER TO postgres;

--
-- Name: batches_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.batches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.batches_id_seq OWNER TO postgres;

--
-- Name: batches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.batches_id_seq OWNED BY public.batches.id;


--
-- Name: carousel_slides; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.carousel_slides (
    id integer NOT NULL,
    src text NOT NULL,
    alt character varying(255),
    badge character varying(255) DEFAULT 'New Course Available'::character varying,
    title character varying(255) DEFAULT 'Advancing Through Neural Networks'::character varying,
    description text DEFAULT 'Explore the foundations of modern AI with our comprehensive advanced study module.'::text,
    slide_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.carousel_slides OWNER TO postgres;

--
-- Name: carousel_slides_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.carousel_slides_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.carousel_slides_id_seq OWNER TO postgres;

--
-- Name: carousel_slides_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.carousel_slides_id_seq OWNED BY public.carousel_slides.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    has_subcategories boolean DEFAULT true NOT NULL,
    target_course text DEFAULT 'all'::character varying,
    target_program text DEFAULT 'all'::character varying,
    target_major text DEFAULT 'all'::character varying,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: custom_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.custom_roles (
    id integer NOT NULL,
    role_key character varying(60) NOT NULL,
    name character varying(120) NOT NULL,
    description text,
    permissions jsonb DEFAULT '[]'::jsonb NOT NULL,
    is_system boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.custom_roles OWNER TO postgres;

--
-- Name: custom_roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.custom_roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.custom_roles_id_seq OWNER TO postgres;

--
-- Name: custom_roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.custom_roles_id_seq OWNED BY public.custom_roles.id;


--
-- Name: daily_registration_stats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.daily_registration_stats (
    id integer NOT NULL,
    date date NOT NULL,
    exam_type character varying(100) NOT NULL,
    batch_id integer,
    new_registrations_count integer DEFAULT 0,
    active_users_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.daily_registration_stats OWNER TO postgres;

--
-- Name: daily_registration_stats_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.daily_registration_stats_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.daily_registration_stats_id_seq OWNER TO postgres;

--
-- Name: daily_registration_stats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.daily_registration_stats_id_seq OWNED BY public.daily_registration_stats.id;


--
-- Name: daily_student_stats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.daily_student_stats (
    id integer NOT NULL,
    stat_date date NOT NULL,
    user_id integer NOT NULL,
    subject_id integer,
    total_seconds integer DEFAULT 0 NOT NULL,
    lecture_seconds integer DEFAULT 0 NOT NULL,
    test_seconds integer DEFAULT 0 NOT NULL,
    quiz_attempts integer DEFAULT 0 NOT NULL,
    resource_hits integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.daily_student_stats OWNER TO postgres;

--
-- Name: daily_student_stats_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.daily_student_stats_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.daily_student_stats_id_seq OWNER TO postgres;

--
-- Name: daily_student_stats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.daily_student_stats_id_seq OWNED BY public.daily_student_stats.id;


--
-- Name: examinations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.examinations (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.examinations OWNER TO postgres;

--
-- Name: examinations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.examinations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.examinations_id_seq OWNER TO postgres;

--
-- Name: examinations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.examinations_id_seq OWNED BY public.examinations.id;


--
-- Name: gradebooks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gradebooks (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    code character varying(100) NOT NULL,
    batch_id integer NOT NULL,
    exam_id integer NOT NULL,
    status character varying(50) DEFAULT 'ACTIVE'::character varying,
    targets jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.gradebooks OWNER TO postgres;

--
-- Name: gradebooks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.gradebooks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.gradebooks_id_seq OWNER TO postgres;

--
-- Name: gradebooks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.gradebooks_id_seq OWNED BY public.gradebooks.id;


--
-- Name: majors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.majors (
    id integer NOT NULL,
    program_id integer NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.majors OWNER TO postgres;

--
-- Name: majors_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.majors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.majors_id_seq OWNER TO postgres;

--
-- Name: majors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.majors_id_seq OWNED BY public.majors.id;


--
-- Name: mock_exam_scores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mock_exam_scores (
    id integer NOT NULL,
    student_id integer NOT NULL,
    mock_exam_id integer NOT NULL,
    score integer DEFAULT 0 NOT NULL,
    max_score integer DEFAULT 0 NOT NULL,
    student_answers jsonb DEFAULT '{}'::jsonb,
    completed_at timestamp with time zone DEFAULT now(),
    attempts_count integer DEFAULT 1
);


ALTER TABLE public.mock_exam_scores OWNER TO postgres;

--
-- Name: mock_exam_scores_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.mock_exam_scores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mock_exam_scores_id_seq OWNER TO postgres;

--
-- Name: mock_exam_scores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.mock_exam_scores_id_seq OWNED BY public.mock_exam_scores.id;


--
-- Name: mock_exam_targets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mock_exam_targets (
    id integer NOT NULL,
    mock_exam_id integer NOT NULL,
    batch_id integer,
    program_id integer,
    major_id integer
);


ALTER TABLE public.mock_exam_targets OWNER TO postgres;

--
-- Name: mock_exam_targets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.mock_exam_targets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mock_exam_targets_id_seq OWNER TO postgres;

--
-- Name: mock_exam_targets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.mock_exam_targets_id_seq OWNED BY public.mock_exam_targets.id;


--
-- Name: mock_exams; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mock_exams (
    id integer NOT NULL,
    exam_code character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    questions jsonb DEFAULT '[]'::jsonb NOT NULL,
    targets jsonb DEFAULT '[]'::jsonb NOT NULL,
    unlock_date timestamp with time zone,
    status character varying(20) DEFAULT 'locked'::character varying NOT NULL,
    created_by integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT mock_exams_status_check CHECK (((status)::text = ANY (ARRAY[('active'::character varying)::text, ('locked'::character varying)::text])))
);


ALTER TABLE public.mock_exams OWNER TO postgres;

--
-- Name: mock_exams_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.mock_exams_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mock_exams_id_seq OWNER TO postgres;

--
-- Name: mock_exams_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.mock_exams_id_seq OWNED BY public.mock_exams.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    student_id integer,
    type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    link character varying(255),
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: pre_registrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pre_registrations (
    id integer NOT NULL,
    first_name character varying(100) NOT NULL,
    middle_name character varying(100),
    last_name character varying(100) NOT NULL,
    suffix character varying(20),
    email character varying(255) NOT NULL,
    phone character varying(50),
    birthday date,
    gender character varying(20),
    address text,
    city character varying(100),
    province character varying(100),
    zip_code character varying(20),
    school character varying(255),
    school_id integer,
    course character varying(255),
    academic_course_id integer,
    year_graduated character varying(20),
    highest_education character varying(100),
    exam_id integer,
    program_id integer,
    major_id integer,
    batch_id integer,
    status character varying(50) DEFAULT 'PENDING'::character varying,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    reviewed_at timestamp with time zone,
    reviewed_by integer
);


ALTER TABLE public.pre_registrations OWNER TO postgres;

--
-- Name: pre_registrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pre_registrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pre_registrations_id_seq OWNER TO postgres;

--
-- Name: pre_registrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pre_registrations_id_seq OWNED BY public.pre_registrations.id;


--
-- Name: programs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.programs (
    id integer NOT NULL,
    exam_id integer NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.programs OWNER TO postgres;

--
-- Name: programs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.programs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.programs_id_seq OWNER TO postgres;

--
-- Name: programs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.programs_id_seq OWNED BY public.programs.id;


--
-- Name: schools; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.schools (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    address text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.schools OWNER TO postgres;

--
-- Name: schools_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.schools_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.schools_id_seq OWNER TO postgres;

--
-- Name: schools_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.schools_id_seq OWNED BY public.schools.id;


--
-- Name: security_audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.security_audit_logs (
    id integer NOT NULL,
    user_id integer,
    user_name character varying(150),
    user_role character varying(50),
    event_type character varying(100) NOT NULL,
    description text NOT NULL,
    ip_address character varying(45) DEFAULT '127.0.0.1'::character varying,
    status character varying(20) DEFAULT 'success'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.security_audit_logs OWNER TO postgres;

--
-- Name: security_audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.security_audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.security_audit_logs_id_seq OWNER TO postgres;

--
-- Name: security_audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.security_audit_logs_id_seq OWNED BY public.security_audit_logs.id;


--
-- Name: student_activities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_activities (
    id integer NOT NULL,
    student_id integer NOT NULL,
    activity_type character varying(100) NOT NULL,
    title character varying(255) NOT NULL,
    details text,
    status character varying(50) DEFAULT 'completed'::character varying,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.student_activities OWNER TO postgres;

--
-- Name: student_activities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.student_activities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.student_activities_id_seq OWNER TO postgres;

--
-- Name: student_activities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.student_activities_id_seq OWNED BY public.student_activities.id;


--
-- Name: student_calendar_notes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_calendar_notes (
    id integer NOT NULL,
    student_id integer NOT NULL,
    event_date date NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    "time" character varying(50),
    tag character varying(50),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.student_calendar_notes OWNER TO postgres;

--
-- Name: student_calendar_notes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.student_calendar_notes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.student_calendar_notes_id_seq OWNER TO postgres;

--
-- Name: student_calendar_notes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.student_calendar_notes_id_seq OWNED BY public.student_calendar_notes.id;


--
-- Name: student_quiz_submissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_quiz_submissions (
    id integer NOT NULL,
    student_id integer NOT NULL,
    content_id integer NOT NULL,
    earned_points integer DEFAULT 0 NOT NULL,
    total_points integer DEFAULT 0 NOT NULL,
    time_taken_seconds integer DEFAULT 0 NOT NULL,
    answers jsonb DEFAULT '[]'::jsonb NOT NULL,
    attempts_count integer DEFAULT 1 NOT NULL,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.student_quiz_submissions OWNER TO postgres;

--
-- Name: student_quiz_submissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.student_quiz_submissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.student_quiz_submissions_id_seq OWNER TO postgres;

--
-- Name: student_quiz_submissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.student_quiz_submissions_id_seq OWNED BY public.student_quiz_submissions.id;


--
-- Name: student_subject_progress; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_subject_progress (
    id integer NOT NULL,
    student_id integer NOT NULL,
    subject_id integer NOT NULL,
    completed_items integer DEFAULT 0 NOT NULL,
    total_items integer DEFAULT 0 NOT NULL,
    progress_pct integer DEFAULT 0 NOT NULL,
    active_days integer DEFAULT 0 NOT NULL,
    study_streak integer DEFAULT 0 NOT NULL,
    last_activity_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.student_subject_progress OWNER TO postgres;

--
-- Name: student_subject_progress_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.student_subject_progress_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.student_subject_progress_id_seq OWNER TO postgres;

--
-- Name: student_subject_progress_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.student_subject_progress_id_seq OWNED BY public.student_subject_progress.id;


--
-- Name: student_subjects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_subjects (
    id integer NOT NULL,
    student_id integer NOT NULL,
    subject_id integer NOT NULL,
    assigned_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.student_subjects OWNER TO postgres;

--
-- Name: student_subjects_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.student_subjects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.student_subjects_id_seq OWNER TO postgres;

--
-- Name: student_subjects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.student_subjects_id_seq OWNED BY public.student_subjects.id;


--
-- Name: study_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.study_sessions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    subject_id integer,
    activity_type character varying(50) DEFAULT 'lecture'::character varying,
    session_start timestamp with time zone DEFAULT now() NOT NULL,
    session_end timestamp with time zone DEFAULT now() NOT NULL,
    duration_seconds integer DEFAULT 60 NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.study_sessions OWNER TO postgres;

--
-- Name: study_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.study_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.study_sessions_id_seq OWNER TO postgres;

--
-- Name: study_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.study_sessions_id_seq OWNED BY public.study_sessions.id;


--
-- Name: subcategories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subcategories (
    id integer NOT NULL,
    category_id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    image_url text,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT subcategories_status_check CHECK (((status)::text = ANY (ARRAY[('active'::character varying)::text, ('inactive'::character varying)::text])))
);


ALTER TABLE public.subcategories OWNER TO postgres;

--
-- Name: subcategories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.subcategories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.subcategories_id_seq OWNER TO postgres;

--
-- Name: subcategories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.subcategories_id_seq OWNED BY public.subcategories.id;


--
-- Name: subject_contents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subject_contents (
    id integer NOT NULL,
    module_id integer,
    subject_code character varying(50),
    title character varying(255) NOT NULL,
    lesson_type character varying(50) DEFAULT 'module'::character varying,
    contentbuilder_id character varying(100),
    pdf_files jsonb DEFAULT '[]'::jsonb,
    quiz_content text,
    order_index integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.subject_contents OWNER TO postgres;

--
-- Name: subject_contents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.subject_contents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.subject_contents_id_seq OWNER TO postgres;

--
-- Name: subject_contents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.subject_contents_id_seq OWNED BY public.subject_contents.id;


--
-- Name: subject_modules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subject_modules (
    id integer NOT NULL,
    subject_id integer,
    title character varying(255) NOT NULL,
    order_index integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.subject_modules OWNER TO postgres;

--
-- Name: subject_modules_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.subject_modules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.subject_modules_id_seq OWNER TO postgres;

--
-- Name: subject_modules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.subject_modules_id_seq OWNED BY public.subject_modules.id;


--
-- Name: subjects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subjects (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    code character varying(50) NOT NULL,
    description text,
    image_url text,
    category character varying(100),
    category_id integer,
    subcategory_id integer,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    unlock_date timestamp with time zone,
    topics jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT subjects_status_check CHECK (((status)::text = ANY (ARRAY[('active'::character varying)::text, ('inactive'::character varying)::text])))
);


ALTER TABLE public.subjects OWNER TO postgres;

--
-- Name: subjects_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.subjects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.subjects_id_seq OWNER TO postgres;

--
-- Name: subjects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.subjects_id_seq OWNED BY public.subjects.id;


--
-- Name: submissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.submissions (
    id integer NOT NULL,
    assignment_id integer NOT NULL,
    student_id integer NOT NULL,
    content text,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    grade character varying(10),
    feedback text,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL,
    reviewed_at timestamp with time zone,
    CONSTRAINT submissions_status_check CHECK (((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('reviewed'::character varying)::text])))
);


ALTER TABLE public.submissions OWNER TO postgres;

--
-- Name: submissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.submissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.submissions_id_seq OWNER TO postgres;

--
-- Name: submissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.submissions_id_seq OWNED BY public.submissions.id;


--
-- Name: system_security_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_security_settings (
    id integer DEFAULT 1 NOT NULL,
    single_session_enabled boolean DEFAULT true,
    audit_logging_enabled boolean DEFAULT true,
    watermark_enabled boolean DEFAULT true,
    watermark_text character varying(100) DEFAULT '{name} - {email}'::character varying,
    watermark_opacity integer DEFAULT 15,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.system_security_settings OWNER TO postgres;

--
-- Name: trash_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.trash_items (
    id integer NOT NULL,
    entity_type character varying(50) NOT NULL,
    original_id character varying(100),
    item_name character varying(255) NOT NULL,
    description text,
    original_location character varying(100),
    payload jsonb NOT NULL,
    deleted_by integer,
    deleted_by_name character varying(255),
    deleted_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.trash_items OWNER TO postgres;

--
-- Name: trash_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.trash_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.trash_items_id_seq OWNER TO postgres;

--
-- Name: trash_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.trash_items_id_seq OWNED BY public.trash_items.id;


--
-- Name: uploaded_files; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.uploaded_files (
    id integer NOT NULL,
    filename text NOT NULL,
    content_type text,
    size bigint DEFAULT 0 NOT NULL,
    data bytea NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.uploaded_files OWNER TO postgres;

--
-- Name: uploaded_files_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.uploaded_files_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.uploaded_files_id_seq OWNER TO postgres;

--
-- Name: uploaded_files_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.uploaded_files_id_seq OWNED BY public.uploaded_files.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    role character varying(20) DEFAULT 'student'::character varying NOT NULL,
    first_name character varying(100),
    middle_name character varying(100),
    last_name character varying(100),
    suffix character varying(20),
    birthday date,
    gender character varying(30),
    phone character varying(30),
    address character varying(255),
    city character varying(100),
    province character varying(100),
    zip_code character varying(20),
    school character varying(255),
    course character varying(255),
    year_graduated character varying(10),
    highest_education character varying(50),
    avatar text,
    avatar_url text,
    batch_id integer,
    exam_id integer,
    program_id integer,
    major_id integer,
    school_id integer,
    academic_course_id integer,
    job_role_description text,
    lept_major_id integer,
    examinee_status character varying(50),
    diagnostic_score integer,
    personal_target_score integer,
    font_preference character varying(50) DEFAULT 'geist'::character varying,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    last_login_at timestamp with time zone,
    login_count integer DEFAULT 0,
    targets jsonb DEFAULT '[]'::jsonb,
    personal_email character varying(255),
    is_active boolean DEFAULT true,
    subscription_end_date date,
    login_prefix character varying(100),
    login_number character varying(20),
    login_id character varying(120),
    target_exam character varying(100),
    target_exam_date date,
    status character varying(50) DEFAULT 'active'::character varying
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: academic_courses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.academic_courses ALTER COLUMN id SET DEFAULT nextval('public.academic_courses_id_seq'::regclass);


--
-- Name: assignments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments ALTER COLUMN id SET DEFAULT nextval('public.assignments_id_seq'::regclass);


--
-- Name: batches id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.batches ALTER COLUMN id SET DEFAULT nextval('public.batches_id_seq'::regclass);


--
-- Name: carousel_slides id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carousel_slides ALTER COLUMN id SET DEFAULT nextval('public.carousel_slides_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: custom_roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.custom_roles ALTER COLUMN id SET DEFAULT nextval('public.custom_roles_id_seq'::regclass);


--
-- Name: daily_registration_stats id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_registration_stats ALTER COLUMN id SET DEFAULT nextval('public.daily_registration_stats_id_seq'::regclass);


--
-- Name: daily_student_stats id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_student_stats ALTER COLUMN id SET DEFAULT nextval('public.daily_student_stats_id_seq'::regclass);


--
-- Name: examinations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.examinations ALTER COLUMN id SET DEFAULT nextval('public.examinations_id_seq'::regclass);


--
-- Name: gradebooks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gradebooks ALTER COLUMN id SET DEFAULT nextval('public.gradebooks_id_seq'::regclass);


--
-- Name: majors id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.majors ALTER COLUMN id SET DEFAULT nextval('public.majors_id_seq'::regclass);


--
-- Name: mock_exam_scores id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mock_exam_scores ALTER COLUMN id SET DEFAULT nextval('public.mock_exam_scores_id_seq'::regclass);


--
-- Name: mock_exam_targets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mock_exam_targets ALTER COLUMN id SET DEFAULT nextval('public.mock_exam_targets_id_seq'::regclass);


--
-- Name: mock_exams id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mock_exams ALTER COLUMN id SET DEFAULT nextval('public.mock_exams_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: pre_registrations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pre_registrations ALTER COLUMN id SET DEFAULT nextval('public.pre_registrations_id_seq'::regclass);


--
-- Name: programs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.programs ALTER COLUMN id SET DEFAULT nextval('public.programs_id_seq'::regclass);


--
-- Name: schools id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schools ALTER COLUMN id SET DEFAULT nextval('public.schools_id_seq'::regclass);


--
-- Name: security_audit_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.security_audit_logs ALTER COLUMN id SET DEFAULT nextval('public.security_audit_logs_id_seq'::regclass);


--
-- Name: student_activities id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_activities ALTER COLUMN id SET DEFAULT nextval('public.student_activities_id_seq'::regclass);


--
-- Name: student_calendar_notes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_calendar_notes ALTER COLUMN id SET DEFAULT nextval('public.student_calendar_notes_id_seq'::regclass);


--
-- Name: student_quiz_submissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_quiz_submissions ALTER COLUMN id SET DEFAULT nextval('public.student_quiz_submissions_id_seq'::regclass);


--
-- Name: student_subject_progress id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_subject_progress ALTER COLUMN id SET DEFAULT nextval('public.student_subject_progress_id_seq'::regclass);


--
-- Name: student_subjects id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_subjects ALTER COLUMN id SET DEFAULT nextval('public.student_subjects_id_seq'::regclass);


--
-- Name: study_sessions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.study_sessions ALTER COLUMN id SET DEFAULT nextval('public.study_sessions_id_seq'::regclass);


--
-- Name: subcategories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subcategories ALTER COLUMN id SET DEFAULT nextval('public.subcategories_id_seq'::regclass);


--
-- Name: subject_contents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subject_contents ALTER COLUMN id SET DEFAULT nextval('public.subject_contents_id_seq'::regclass);


--
-- Name: subject_modules id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subject_modules ALTER COLUMN id SET DEFAULT nextval('public.subject_modules_id_seq'::regclass);


--
-- Name: subjects id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subjects ALTER COLUMN id SET DEFAULT nextval('public.subjects_id_seq'::regclass);


--
-- Name: submissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submissions ALTER COLUMN id SET DEFAULT nextval('public.submissions_id_seq'::regclass);


--
-- Name: trash_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trash_items ALTER COLUMN id SET DEFAULT nextval('public.trash_items_id_seq'::regclass);


--
-- Name: uploaded_files id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.uploaded_files ALTER COLUMN id SET DEFAULT nextval('public.uploaded_files_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: academic_courses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.academic_courses (id, name, created_at, updated_at) FROM stdin;
1	Bachelor of Elementary Education (BEEd)	2026-09-11 17:42:31.325+08	2026-09-11 17:42:31.325+08
2	Bachelor of Secondary Education (BSEd)	2026-09-11 17:42:41.866+08	2026-09-11 17:42:41.866+08
\.


--
-- Data for Name: assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assignments (id, title, description, teacher_id, created_at) FROM stdin;
\.


--
-- Data for Name: batches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.batches (id, name, exam_id, target_year, status, created_at, updated_at, start_date, end_date) FROM stdin;
\.


--
-- Data for Name: carousel_slides; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.carousel_slides (id, src, alt, badge, title, description, slide_order, created_at, updated_at) FROM stdin;
4	/banners/banner-3.jpg	Peak Excellence Campus Life				2	2026-09-13 15:42:03.503069+08	2026-09-13 15:42:03.503069+08
2	/landingpageassets/banner.png	Peak Excellence Learning Banner	Welcome	Welcome to Peak Review	Everything you need to prepare for your exams, study lessons, and track your progress in one place.	0	2026-09-13 15:39:25.847343+08	2026-09-13 15:50:29.519432+08
3	/banners/banner-2.jpg	Peak Excellence Review Sessions	New Schedule	Upcoming Review Classes	Check your timetable and join live lecture sessions with our expert teachers.	1	2026-09-13 15:42:03.485641+08	2026-09-13 15:50:29.544029+08
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, name, description, has_subcategories, target_course, target_program, target_major, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: custom_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.custom_roles (id, role_key, name, description, permissions, is_system, created_at, updated_at) FROM stdin;
1	super_admin	Super Admin	Full system access and master controls across all features	["/admin", "/admin/users", "/admin/curriculum", "/admin/mock-exams", "/admin/master-data", "/admin/analytical-overview", "/admin/trash", "/admin/settings", "/admin/subscriptions", "/admin/settings/security"]	t	2026-09-12 11:54:42.081351+08	2026-10-20 13:39:08.246456+08
7	admin	Admin	\N	["/admin", "/admin/subscriptions", "/admin/users", "/admin/curriculum", "/admin/mock-exams", "/admin/master-data", "/admin/trash", "/admin/analytical-overview", "/admin/settings", "/admin/settings/security"]	f	2026-10-20 16:02:32.138413+08	2026-10-20 16:02:32.138413+08
\.


--
-- Data for Name: daily_registration_stats; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.daily_registration_stats (id, date, exam_type, batch_id, new_registrations_count, active_users_count, created_at, updated_at) FROM stdin;
916	2026-09-11	General	\N	1	1	2026-10-20 13:38:02.677972+08	2026-10-20 15:15:29.097513+08
\.


--
-- Data for Name: daily_student_stats; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.daily_student_stats (id, stat_date, user_id, subject_id, total_seconds, lecture_seconds, test_seconds, quiz_attempts, resource_hits, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: examinations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.examinations (id, name, created_at, updated_at) FROM stdin;
1	Licensure Examination for Professional Teachers (LEPT)	2026-09-11 17:28:04.835+08	2026-09-11 17:28:04.835+08
4	Philippine Nurse Licensure Examination (PNLE)	2026-10-14 15:27:42.544778+08	2026-10-14 15:27:42.544778+08
5	NCLEX-RN	2026-10-14 15:29:47.668037+08	2026-10-14 15:29:47.668037+08
\.


--
-- Data for Name: gradebooks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gradebooks (id, name, code, batch_id, exam_id, status, targets, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: majors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.majors (id, program_id, name, created_at) FROM stdin;
1	3	English	2026-09-11 17:39:36.054+08
2	3	Filipino	2026-09-11 17:39:40.87+08
3	3	Mathematics	2026-09-11 17:39:45.247+08
\.


--
-- Data for Name: mock_exam_scores; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.mock_exam_scores (id, student_id, mock_exam_id, score, max_score, student_answers, completed_at, attempts_count) FROM stdin;
\.


--
-- Data for Name: mock_exam_targets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.mock_exam_targets (id, mock_exam_id, batch_id, program_id, major_id) FROM stdin;
\.


--
-- Data for Name: mock_exams; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.mock_exams (id, exam_code, title, description, questions, targets, unlock_date, status, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, student_id, type, title, message, link, is_read, created_at) FROM stdin;
\.


--
-- Data for Name: pre_registrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pre_registrations (id, first_name, middle_name, last_name, suffix, email, phone, birthday, gender, address, city, province, zip_code, school, school_id, course, academic_course_id, year_graduated, highest_education, exam_id, program_id, major_id, batch_id, status, notes, created_at, reviewed_at, reviewed_by) FROM stdin;
\.


--
-- Data for Name: programs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.programs (id, exam_id, name, created_at) FROM stdin;
2	1	Bachelor of Elementary Education (BEEd)	2026-09-11 17:39:08.304+08
3	1	Bachelor of Secondary Education (BSEd)	2026-09-11 17:39:28.053+08
4	1	Bachelor of Early Childhood Education (BECEd)	2026-09-13 18:58:09.423417+08
5	1	Bachelor of Special Needs Education (BSNEd)	2026-09-13 18:58:09.447189+08
6	4	Nursing	2026-10-14 15:27:58.53492+08
7	5	Nursing	2026-10-14 15:29:59.042717+08
\.


--
-- Data for Name: schools; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.schools (id, name, address, created_at, updated_at) FROM stdin;
1	Liceo de Cagayan University	Cagayan de Oro	2026-09-11 17:40:41.219+08	2026-09-11 17:40:41.219+08
2	Xavier University – Ateneo de Cagayan	Cagayan de Oro	2026-09-11 17:41:10.928+08	2026-09-11 17:41:10.928+08
3	PHINMA – Cagayan de Oro College (COC)	Cagayan de Oro	2026-09-11 17:41:25.762+08	2026-09-11 17:41:25.762+08
\.


--
-- Data for Name: security_audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.security_audit_logs (id, user_id, user_name, user_role, event_type, description, ip_address, status, created_at) FROM stdin;
\.


--
-- Data for Name: student_activities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_activities (id, student_id, activity_type, title, details, status, created_at) FROM stdin;
\.


--
-- Data for Name: student_calendar_notes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_calendar_notes (id, student_id, event_date, title, description, "time", tag, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: student_quiz_submissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_quiz_submissions (id, student_id, content_id, earned_points, total_points, time_taken_seconds, answers, attempts_count, submitted_at) FROM stdin;
\.


--
-- Data for Name: student_subject_progress; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_subject_progress (id, student_id, subject_id, completed_items, total_items, progress_pct, active_days, study_streak, last_activity_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: student_subjects; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_subjects (id, student_id, subject_id, assigned_at) FROM stdin;
\.


--
-- Data for Name: study_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.study_sessions (id, user_id, subject_id, activity_type, session_start, session_end, duration_seconds, metadata, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: subcategories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subcategories (id, category_id, name, description, image_url, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: subject_contents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subject_contents (id, module_id, subject_code, title, lesson_type, contentbuilder_id, pdf_files, quiz_content, order_index, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: subject_modules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subject_modules (id, subject_id, title, order_index, created_at) FROM stdin;
\.


--
-- Data for Name: subjects; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subjects (id, title, code, description, image_url, category, category_id, subcategory_id, status, unlock_date, topics, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: submissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.submissions (id, assignment_id, student_id, content, status, grade, feedback, submitted_at, reviewed_at) FROM stdin;
\.


--
-- Data for Name: system_security_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_security_settings (id, single_session_enabled, audit_logging_enabled, watermark_enabled, watermark_text, watermark_opacity, updated_at) FROM stdin;
1	t	t	t	{name} - {email}	15	2026-10-13 19:24:31.219835
\.


--
-- Data for Name: trash_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.trash_items (id, entity_type, original_id, item_name, description, original_location, payload, deleted_by, deleted_by_name, deleted_at) FROM stdin;
7	CURRICULUM_CATEGORY	1	General Education	Target Course: ["Licensure Examination for Professional Teachers (LEPT)"]	/admin/curriculum	{"id": 1, "name": "General Education", "created_at": "2026-09-11T23:48:18.632Z", "updated_at": "2026-09-11T23:48:18.632Z", "description": null, "target_major": "all", "target_course": "[\\"Licensure Examination for Professional Teachers (LEPT)\\"]", "target_program": "all", "has_subcategories": true}	1	admin@peak.edu.ph	2026-10-20 15:14:28.740053+08
8	CURRICULUM_SUBCATEGORY	1	English	Category: General Education	/admin/curriculum	{"id": 1, "name": "English", "status": "active", "image_url": "https://asvaaiyjouxx5hpt.public.blob.vercel-storage.com/subcategories/1789171600638-Untitleddesign.png", "created_at": "2026-09-11T23:50:40.670Z", "updated_at": "2026-09-12T00:06:46.384Z", "category_id": 1, "description": null, "_parent_category_id": 1, "_parent_category_name": "General Education"}	1	admin@peak.edu.ph	2026-10-20 15:14:28.750156+08
9	CURRICULUM_SUBCATEGORY	2	Filipino	The Filipino section tests your basic grammar, reading comprehension, understanding of figures of speech, and knowledge of classic Philippine literature.	/admin/curriculum	{"id": 2, "name": "Filipino", "status": "inactive", "image_url": "https://asvaaiyjouxx5hpt.public.blob.vercel-storage.com/subcategories/1789171695957-Untitleddesign1.png", "created_at": "2026-09-12T00:08:19.797Z", "updated_at": "2026-09-12T13:39:28.654Z", "category_id": 1, "description": "The Filipino section tests your basic grammar, reading comprehension, understanding of figures of speech, and knowledge of classic Philippine literature.", "_parent_category_id": 1, "_parent_category_name": "General Education"}	1	admin@peak.edu.ph	2026-10-20 15:14:28.752817+08
10	CURRICULUM_SUBJECT	1	Study and Thinking Skills	Code: ENG-101 • Category: General Education	/admin/curriculum	{"id": 1, "code": "ENG-101", "title": "Study and Thinking Skills", "status": "active", "topics": [], "_modules": [{"id": 1, "title": "Critical Reading and Information Processing", "created_at": "2026-09-12T13:41:15.493Z", "subject_id": 1, "order_index": 0}], "category": "General Education", "_contents": [{"id": 3, "title": "Quiz I", "module_id": 1, "pdf_files": [], "created_at": "2026-09-16T00:20:40.443Z", "updated_at": "2026-09-16T00:20:40.443Z", "lesson_type": "quiz", "order_index": 0, "quiz_content": null, "subject_code": null, "contentbuilder_id": null}], "image_url": null, "created_at": "2026-09-12T13:40:06.423Z", "updated_at": "2026-09-12T13:40:06.423Z", "category_id": null, "description": "Reading comprehension, critical analysis, contextual clues, and vocabulary development.", "unlock_date": null, "subcategory_id": 1, "_parent_category_id": 1, "_parent_category_name": "General Education"}	1	admin@peak.edu.ph	2026-10-20 15:14:28.759394+08
11	CURRICULUM_CATEGORY	2	Professional Education	Target Course: ["Licensure Examination for Professional Teachers (LEPT)"]	/admin/curriculum	{"id": 2, "name": "Professional Education", "created_at": "2026-09-11T23:48:37.048Z", "updated_at": "2026-09-11T23:48:37.048Z", "description": null, "target_major": "all", "target_course": "[\\"Licensure Examination for Professional Teachers (LEPT)\\"]", "target_program": "all", "has_subcategories": true}	1	admin@peak.edu.ph	2026-10-20 15:14:33.560223+08
12	CURRICULUM_CATEGORY	3	Specialization (English)	Target Course: ["Licensure Examination for Professional Teachers (LEPT)"]	/admin/curriculum	{"id": 3, "name": "Specialization (English)", "created_at": "2026-09-11T23:49:05.043Z", "updated_at": "2026-09-11T23:49:05.043Z", "description": null, "target_major": "[\\"English\\"]", "target_course": "[\\"Licensure Examination for Professional Teachers (LEPT)\\"]", "target_program": "[\\"Bachelor of Secondary Education (BSEd)\\"]", "has_subcategories": true}	1	admin@peak.edu.ph	2026-10-20 15:14:35.974393+08
13	CURRICULUM_CATEGORY	4	Specialization (Filipino)	Target Course: ["Licensure Examination for Professional Teachers (LEPT)"]	/admin/curriculum	{"id": 4, "name": "Specialization (Filipino)", "created_at": "2026-09-11T23:49:25.635Z", "updated_at": "2026-09-11T23:49:25.635Z", "description": null, "target_major": "[\\"Filipino\\"]", "target_course": "[\\"Licensure Examination for Professional Teachers (LEPT)\\"]", "target_program": "[\\"Bachelor of Secondary Education (BSEd)\\"]", "has_subcategories": true}	1	admin@peak.edu.ph	2026-10-20 15:14:38.062954+08
14	MASTER_DATA_BATCH	1	Batch 1	Target Year: 2027 • Status: active	/admin/master-data	{"id": 1, "name": "Batch 1", "status": "active", "exam_id": 1, "end_date": "2026-12-31T16:00:00.000Z", "created_at": "2026-09-11T09:40:13.832Z", "start_date": null, "updated_at": "2026-09-11T09:40:13.832Z", "target_year": 2027}	1	admin@peak.edu.ph	2026-10-20 15:15:09.041924+08
15	MASTER_DATA_BATCH	5	Batch Test	Target Year: 2027 • Status: upcoming	/admin/master-data	{"id": 5, "name": "Batch Test", "status": "upcoming", "exam_id": 1, "end_date": "2027-12-31T16:00:00.000Z", "created_at": "2026-10-20T01:16:22.925Z", "start_date": "2026-12-31T16:00:00.000Z", "updated_at": "2026-10-20T01:16:22.925Z", "target_year": 2027}	1	admin@peak.edu.ph	2026-10-20 15:15:12.200625+08
16	MASTER_DATA_BATCH	3	LEPT Fast-Track 2026	Target Year: 2026 • Status: active	/admin/master-data	{"id": 3, "name": "LEPT Fast-Track 2026", "status": "active", "exam_id": 1, "end_date": "2026-09-19T16:00:00.000Z", "created_at": "2026-09-13T10:58:09.472Z", "start_date": "2026-09-12T16:00:00.000Z", "updated_at": "2026-09-13T10:58:09.472Z", "target_year": 2026}	1	admin@peak.edu.ph	2026-10-20 15:15:14.915327+08
17	MASTER_DATA_BATCH	2	LEPT Intensive Review 2026	Target Year: 2026 • Status: active	/admin/master-data	{"id": 2, "name": "LEPT Intensive Review 2026", "status": "active", "exam_id": 1, "end_date": "2026-10-27T16:00:00.000Z", "created_at": "2026-09-13T10:58:09.460Z", "start_date": "2026-09-12T16:00:00.000Z", "updated_at": "2026-09-13T10:58:09.460Z", "target_year": 2026}	1	admin@peak.edu.ph	2026-10-20 15:15:17.036179+08
\.


--
-- Data for Name: uploaded_files; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.uploaded_files (id, filename, content_type, size, data, created_at) FROM stdin;
1	1789135480249_511268821_24764698609786364_1062022903089640038_n.jpg	image/jpeg	100447	\\xffd8ffe000104a46494600010100000100010000ffed008450686f746f73686f7020332e30003842494d04040000000000681c0228006246424d443061303030613431303230303030666134313030303037633663303030306638373930303030643038303030303030333932303030306166646130303030386265383030303034636636303030303362303030313030356638383031303000ffdb0084000506060b080b0b0b0b0b0d0b0b0b0d0e0e0d0d0e0e0f0d0e0e0e0d0f1010101111101010100f1312130f10111314141311131616161316151516191619161612010505050a070a080909080b080a080b0a0a09090a0a0c090a090a090c0d0b0a0b0b0a0b0d0c0b0b080b0b0c0c0c0d0d0c0c0d0a0b0a0d0c0d0d0c13141313139cffc20011080438043803012200021101031101ffc4010c00000203010101000000000000000000000002010304050607010101010101010100000000000000000000010203040506020003010101010100000000000000000000010203040506071000020103030401040301010101010000000102031112041020132130314014223250053341234260152411000201020404060202020203010000000001020311041012202130314113324051617122810542509114c1233362721200020201030402020301010100000000000102111003203012314041216113500451718122c1130001010406080405040201020700000001000211213110205051617103123032404172812291a1b1526082c1f0627073d142e11304f1233343538090c2ffda000c03010002110322000001f16074f14898104c1848161a2358688eba34ab4e553d8c79ebcad5ce3aeedfcc6c74772799d0e5d6e44ca29be07167a98baf1df7557eb08999b82cb4eb34979aa1998aa2c915cd8f0a66e29516875cb905969358b0524b4ca89225130ca8088e66b23b210326b90cb10a8cb7531e2027559d6e375e2d5b39f7dcba299e4f5c532574d255a63303446782d376191b8c730d2d9a29a6cc123a898086b4cd5d3a260b05ef9606c3107b132c0d26571a15206a32b1686ce476c5452e7a24ef2881ae3383419a0689ccc2f33c0d2b402d8a605b9a6b176ce674c78c03d5f3244c5200044c1c4c0221d6358685245892b1e2eb553a398d6539ecb2eccf8e8eb5fc5d9cbaba023e3755b20ab664d630736cebc7d011d00173260d4ccac899503cd6476b5527635726ec932ac9499564d6cb7989952d0d2e16c58e469955cb404aac5a955e052af5c399162343afc9e98e86aa375ca1ad99554dcc289d53564cdd4a8513b8184de0c6bd052e35bd652e26dd934aa3710c187b741723769d058a3a6a7cd8de0c13b9873a7a2a312ecb8739b6cd30aedac62b9da15c699a676d28292d719ebd0c3346b519a6fa60a5c95d51740a52dce46ae7f423f1807b3e608983800001c12088680b0d1294923ae2c0e8c5d2569c69df871dac55663a74f478ef8e9ecce4d3cfa5a498e9c7d05b0b6a1d38dca67785b34cd8ba6894df39c2d31403436691a67331e99cec77cd2476cd64bb6524d846953301804a00382c814ab82996a8b0556d53a4e873f74adbb68d4c2cb06ac9adc98702357a0ab0ce5733b1d64d02e8ba450d105336e31a20b4ea9b2b04d761917c0a66d056ccf1533645753b3555c5842b2281a4b22b47a905e310888c74dc234022a85f494d2eaa9bc555ba8a3afc7ec27c601ecf9a00110d35a4930824a40108868358988e090d2183ae8d292f994f5f1e7af3ca18eab76617c74f66de3f439755e43e6d6ad15d9e35fb3275e5d6e3eb241cb920ed66b2c98aa9b40b2cc119e4d199a520f2a818970d31282454cc4a889230263a96e065a3a103914f479cb3564d11f57465d971becaae53595b8b1aa93b9a805eb585a9f148d86306f30c16d32037579a69bdf9c27a71ce91ae9a486d6e7b8d74d7234598e6ad339645cf958ed28817568c56c2c46536389750549a0aa0200a01f1df029adf2c0aa66bc5dee077d3e3027d9f330480b120e00a00080238240a486b124710d0121e16896ac79b075ab9bf2daca73d96be7b71d3d2d7c4d7cbafa50b3cf55aee53aebd58ba60edcddbbe5be66492666caccc9431225958e661a53b2cca698953ca4ca6652538856e201c588d8ae03a22957cedd8551754caedebe73cc7ab673acaf7be1b46b29616db9da17c5515ccd725a573b93b55219ea61759982d58aea469b7238b8ccc579430bea5885b665b69742c86a6ca45ad458184033d2c2c2b803e671a4a416c57586b70de34d74d44f9ca40f830d1fd3788f6fa9f1a07abe68081200824ae00044c18042003886580008575544486aaeaaaf1f41269c88e861cf63db92ce7d7bf6f2e7975f5ccba79f4bd562ab32695d62cf8e8e9c7d231dd72ba692abe73c95e521e96ccd2b4b6663d139da55f39d8ef9a1a5dc552769507695442e5a969622226ce768cb2a24869d6d782c63d4b7976d9e8361b8f6b6678ee32da158919d2e8130da02351a023ca8a4b028b240916d22c5b012d469013216c462945c836ce7bc342c0bca416ad20d2f941a23138dc5302e5a905c66617571589a0c4567035f337197e8df2ff00a8758f1a075f9e00000002844c1800800c0041307049058620a341a43aa96183aa9d292f9957531e7b28d194cf56bd5cfb7975f64e76ee5d6eac4d2bcbb52e787657575e3d65365c589928990c924c980e6626367ac8ec119524018ad8da2012930220429cf65610826dbeecda995f6576eb32c2c389798ea8b281a2ccd7099aef3598a4686462929b4034056904955f0465417b430261c28f2490f9458b9b5888690a580aa5eaa3457ae144687196ab2b15ceba8654d760e4c7590b8dceeef07518b33e5ed947d57e53f56d2f1b331bf06092904c0000401930c161940018002241049081a02a5892949852a3a4a5a6ea26b928baa9da33c4bb5f2dbcfaba1af91a79766e8831a8af2398dbf374e3be55f598d121d9453b56d2ac6a5957367256a9cb31eb9cacad4f8e55b1f091ec324cab28783cb977e3b18c59d63aa6a5b95f7648df3f6bb3e6bb39bea9cf9cefb6bcd50e846052e9273efab4b630b79801b2bcab67718e07429cd22756552d8f818ba06006c6c323a4b824b5574453a11ce54f4530c0d6f84a6c4cd25a97387a573487a8810928121eb15e57cb52636cbb84493527d57e69f4b9a78e03afcf13000010449c01000a100600000000000ca108568358758d12cad694df4e75e7b5713bb42d332ad8553d12578df56ae6f539f55b38f4f3e9b5468d69d556f98d1cadbacb7d98ad9a6b6cb64d343e77ced6ca32ec7aa655ef924ef559956cd0a5ae3220da60ce3b1479bab514a355be3be68b2e3acdd56b0a7d4f95ede74ef5bc6bb1d5d439b23a73cc0ba91cd91aecc0174639e59dc612aea64cb25a9f130d73914ba55604aba661986c7c1655a68582b62b8aae8a205d5aa557ad6534d28a575640994aaaadc8067b54b151a330cd8f5f3f4a8cd657b88b97a39bb7ddf86f739e9f1c07a3e5400000824110d070481490c242889935924a0602c3a9ac32c704c04aedae6888f5e75c39e62779301d83289f41e7bb19ae3b6c4ceb45c938e9dd673df1af5d79731ee6c259dbaf8566a3d0ddc07cebe81f80f34eecf15e69da6e2b9f61f9164aeb1cc795d23040df938b75887eb4aa52573af0785def3fdbce7eb71b6ef97b94568c9fd7f8ef619d76dd4db8e92248dc4626599251e6aa68dd258ecd33679fa354965cbd68ab1db730cc6a92c99ba80e759be2cf2ecde0e5d7d691ce4e83d5cb5eac172e8eec53ce2fa481c2cbe9a2af2bb3bd05e7eaf4940f3b5fa0e10c5c6d0f4e5e2e8f3372b25ba576ca1f9f45dee7cffa0878f959f4fcbc0000000022410301240e61a0a02440026618444c05568542b2c6b5d892eba2fcd37e7c4c67b89863b95c08e035ce7e8f2df9d3263ac2623024c22680009804cc11b1130026b8000009224c00800c002ad8251a66a2490da7211f41f9b27d36e505da7e1497a06f3ad0efbf9d2af45abc983d657e602f6d97ca05ecb578492f7edf3e07bd4f0a53e8b67cdc4fd257e700fa2e8f99157d35be5f25f516f96317d50f96353e9e7cce4be927cd6e1f423e7d25ef53c2c9fb9e7f93c14ec3e4a4ba1caaf1d32ada74cebba1cddebbf37ef1e9b91e3827bfcec4c4900002440c082428860d61a04121c0c12c8008935565542b2c6a8f5cb4cbab167a31c04ee1d2c2b8929124c71a28e862f22f7b91cfb2986268b2cd2ab2d1551710a8b814cda0a8b43ac702164510720a34550340892441208242824004d0001300682628926a240001000909004904c0024049480001240051305990040000288e8e20909499a20d008680b0e54b0f01479a2b4c84f7be17dd0f2013dfe5609804c4d018103014904048586882c8180021a02cc81559550acb2911d25d5837f3f3d59809d85b55857c934264352486df45e3e734ab219d8e47a3e3e9e3cfd2397752cd6de6cd5a326c6798e9b18956bebd0d39b3d675f18ee38f3f5fa643f32be9987953d5c8f251eba29e3a9f6bcc4f944b63a72121426188b2cf5b97e6ebf7eb1fced7de5563c4c7b3aeaf20dea507983d42d5e68f4a83cecf7e4700efc17027ba53851dc52e29d9ac72ce82d58a36c0c46c0b19b16aca699194d158a1dec144df14a62e91445eb555364042c05659048d321258a2fb8f13eda1e440f47ca80509891331209025990292015a04049a8d1020011306aacaa8568955a3d734af9dd1e6e7a68027616d5795c34526490a349d64811a643fa6e07a8f37b9457a5387b3526aaee58666ad79562d4b16964be3a7adc9d6df7d98f559b5d2c8e6475233485968110f405f28b8f58a4c9bc8092365bec219fa5a2d8552f3120ee4916166b9b19283895975a44302b6aeea8264a21caa2264916d052ba4a644dc17357a85394bd641c8e17ac9a786eff23a953c77a63f375fa8a8798cde9f8eaf393d0e75ab1ec63aacd9d5479d4f6f9b59f909f7d6d7f3cf4fdbe243c8c87a3e60000120004cac948040008902921c4306a4c4057535865355655575d95e75ab97d4e5e7aeb02751a33e82d312509990d55b61e61d42ccc8d7ecfc8fa9f2fb9909397b82bc474a5f0cf364e9bb0e568d709a6bd48db0f4b1e7bcddebfcdf7d8e96adcac0930a708d5e42baf7cf044ea09260756ef4c69a68765d27a2c8ec2b2174d25574d2c56b5459ba6a136aa146a9f195d7d4e521354c93482425266a8184a9254b3205180a485e422346d59ddf38b0f499df266a8c567226b9ef9d735a75bf7b59e3d776ad73d56ea9dcf2f7e4e88a7ccfabf283c9c3476f9e89244130242001018562900800413000150340886882432a951d155d76579d6ae5f53979ebac09d46acbacaf992921222640b0f15acc83a5e9b87e8bc7ef73e1a397b50486a341234954430155e214d7a6138b2f5705e6dfd8f2dd363d86cdcb67a3cac46f9c8935320d08f457f6b3a45b8f6ca7a6ea77c9b5d5e51230892610129249d226264813519f45155f2359892680022602920b3201121504022260102d5e3bad8bd26973fcbfb1c70c4de6b5cad7ceb35e7a6dd19bd044f758dd795afaa0ac6cf87459d2a6c13e6bd279b1e5027b7cec0d212580b0d022180b3208164982400082438868110d0116c5955a595aabaecaf3a55caeaf2b3d8804ea9d98b6968687d0b32d0ae66428c514783ee7a6f3debfc9ecf9b899e5ee20d2a41a4243a809044491c4306896c271e7e8f06f25dcf89e9e6cc05924b611ebeedf9d5564c7553b72eab8b233f4e1bd86950d1308990448599982a61492e2c6965d58f415d24d5249541305131340253031544924a3944870aa1e29e3bb5856aed62bf9f8be7f9debd3aaafa5c5f567bface9ac0bac94d65958a7358d5ea180be5bd57958fca3d6ddfe79a540f312490ea1665820d0106810cb264814912000293070acb1d75d88aaabb2bce95727adc9cf62813a8df83a7558d0f50f0e122d53ac6041247dee9e0d9e3fa6aa6c4c779121848161e024b41a84c70306a879dbcef8a63a790485924dd1d7ecd2acd6e5a2cced6cd2d9d8d9cfdface66b7e9c1b2ca6c8d85984ca01c809a56752c4426654aa1d42795349e1609e16444c4d532929b052a714a9e2029595a44428c0d76035e468c99d62e34b47ddd1c5d38fa5b385363bd1c373eaa72e9956747c9756aef9c081dff34e83ca4ab76f9d698082410eae710e1a8d02b57835924e024a2404c4820010ae875576d52abaecaf3a53c9eb7233d9004ea9eb727ad533abe94bad9081a4ea2c8083c9f775e6d1e2fa99568cf5c44c192b3068750ab629a30ea5a23ccde56a037e493136468eecbcfe92ee363ab9eb6679aeeb78f3be2ebbf25cfa7e83c7fab97a69b30ef8f5dfe7ecb1dc38b32bb2dc59a76a78a176e78925da38b3576638f09ed3702e1da9e2455dc386a5de3cfc55e80e0157a03cf297a38f3ab57a39f2d157a98f2b157a94f2c957a9a7cd543d1e4e0d74e9d7cf8a5f5d4bbc6482c310135f9c1b23241df14c8b0a823db788f6f4f28c4cf1625a098242b0b5b324ca65034980c060a304a485124021a14aad585aadae55555b5674a395d5e567b6009d33dce2f7acd3623e8778604ccc6aae04790fd03e6d3e1fab98bab9d1531275b3816c5682a5aa6b8a9f3f7925037e6005431eb6567ec366c7a352dab3b73f3bb19d1c5cbd4e7ebce87c69be3e97aef0bec97d2c7d0e2dc297e6d9acba073e2574a79b23a273229d4392a5d89e33175e3931575ce42d5d95e32d8eca71cd2e9c617ab52d3366c4228ab74ea33ce99aa87b58549a5466af5e52a6a68d66b60128da0b29b73d491748a4be6acd17c1d2349217c8cded7c8fae1e659a31e3443c04196b6091104a886ae50ac1aba81e5145ab602b989110c0ad6c415576d52aaaaea73a66e5f4f9b9ef8026f67678bdbb2b6576e8b1a18313022618e2098fb5b336df0fd5425e93a2987539920e46728f3d4f26f09131be10022c6f652eadf6d38f42b57275a2db07557a6060e6f66bb1e5b1fa3e1f4f2eaf5fe27d2de4f63e6bd2f974f9db2ab3af2daf53cd1e063acbac3cd3a9aaa1b4d832bec7ab09d27b3ca9ebc6a798dd17ab9d6749ecf35fab35736ce9b55cb7eaba792ddcd03cdb7acbcbc5b7b3c19dfc5f27de7347905df9baf150f66aa93aa99864ab65b573a77a1618d54d288b5608ccc14b24e8f5de63d3979b647e7e3b413452c93a4bab3886022595990f06b200aae88d994351a0313507ae50d11963aa8d19b3a65e774b998ef2606d7f6395d3d29747a5ae8e1a49112b61d6af5caef7431ebf0fd48ead9deb577b5557a3394f97a31ebce920d71c9009b95acf7a7c7a6b2f609e637d7d8ecf88bf3b7ab5f230bf71a7c86ecebdbaf8db73d56f376eb9af82ee3e0e9e57bde0f479579f92fd3bfa61c96ef5b5f01fd1583cbc76da3e24f76d8f917fa1f79a8f95ddf58bf51f29d1f537b3f307fa6417cdb6fb392f2fa3d4c979cd1da0736ed842ab2412000014787f7de6757f38ea5ef76abcd7ad98bc9ead78bbf063d9a7e890f0c9f5dab15f235fad3d5f15e77d23c076cb9e9a2b2ad99cd6c7dd0aba7f45f9d73d3cdbc3bc586249a55e8ab62c6ab21c25b02b970225ca2b183492204c2995bcab333aca446438cf7e2ce99f06acb8f40225aebe9f37a950d0695b656e2c2582d95b0a565f37e87663dbe2fa88996cef53b60adbc6a51bf3254af5c8f19577cf7ce58d6575045ce482cbbd4e7a2b80d8851a6ec561eaa12c13dde2134fa4798e46de7dfeff00df7c73e97d783bba797d1e9872f76ac653e5fbfb07cd68f4f6634f9d59bb8dcfab4fd03c49bcbedf3e4fd65e700000284d2b53155b0900c000000000022bb41e1f87f4df23bbe15b4686b36f4bd630e77624cc8046003c6780fa9fcd3d3cfc9af759b8e6dbd4ba3e6f6ebed65fbef917d93e37e6df832d1dfe7a242b82643442c19a20443c9ac382b9b02a12f83a22d83a8b1634980e6b71552bd72abe77471cdb9b97a1cfe7e8002fa3d3c3d1d2aa2668ee8e2f786115df50aec2e97df7aeff0017d496d9e7737a3c6426fcd1632ef92da157a724caceb314080000c26d57ae5d48e6b70112e261edae897a49b467b46deef9cdd57b6ecfcd3455f79d1f3cf57a5d7e6742e2e573edcd8bf2be7fd07b5e7bfc9fa9ab85d23a5f44f9fc0fb34f03bf3200044839bb1f974eb99b4c000000000000000ac0e2f33d695f17b41000200002971385dec1d164d1ceb8f494551ebdf87b7674fc9bec1f1fc1c6527bfcf4c4a82c2422d902090e21801311412505788563c9d53611e75d0a79d34d0aaa1d2553976639a63e6eec3cfd289896bdcd74ead2cd0e94b5eab8686a6f0cb628aafa35e6f7f528f31e3fa6d7e5e175c135c64d735b52c75e4802e64c48920a041097490d6e7b8eca180ae921ecce1e8d181c5e88d4bdb3317434d18e9e833e6d8347acf11aaafa3faef88fa4abe81cfd14e2bcb71bddbe757f35cee9f5c3caf6bade3e69e87dff0086c917d7ce3f62480033de0e37616aa692262003000000000000000000000000115da1658d60cb6da082411f1bfb2fc68f88d33e8f9a656915b4c1ab25a524a9c4c870ace549756161d0e5a18e0998243c1d355e4ac956ca4f261df873af1e9be8e7eac4c4dbf4da29baaa29ba8a58228d7b71de342c6818ec5e2636d7ce23cfe88b35a69cf2bd7cf00d4005000000008012096b17535f766b14f460f9ebaabb34b3bd5531052eb356dc8d58d7ab094eceae7b0d57f2f5d5d7f73f3ef579d3d57a0f31e8c71bcc7d1387acfc1f6fa3e20bbdcee9719bf43e87f36bd1f5839dd1cc00011e02b01480000c000000000000000000000000000000000f8d7d97e34394d33e8f99581e90b6074bb910432abb2bba94bc441e262a9aed88570ea64590758cb1c43aaaba74530c5cfe8f3f3bf2736dc58f5065bda7a88bf3e95145d402b2b1bf571f7c3b7997819da143cfdf1041c667cdbe48898e9cc4c1400000026dcba9b45f9d32e9dbab1b73ade96ac69cebbab7674e6475eb8f8d47a5b353e3abf634ea3c653eb39bbc7866ea3a67097ad9aded7aaf2a8a269c76d9eff67c8f40feb1e9fe5bf462b6eb682e779ef5dc23c9e63d564e7b79d76c5d71ed7d13e55d31f518c9af0131222242256448060000000000000000000000000000000007c6becbf1a1cf575f4fccad95bd19958c59b2344b5208c0225a056580aac20a51e28b331049b1652258aaa69d349e4e674b0636e563d9933ea1a736b9a7aaa36e7d18e8d740c746bcb97128dcfa240e5d92018b675e3f314e8cfdfce023598000012edb71a67d77e8e5d14db736355d4bab36d7c5b9b1e2e8d4b20d6f5d021adb0b073fd19a9f1987daf17a65e733f6f1f4c7357b7174c6b65bb5156968aa558abbdeb7e77d3b3f65e9783ef55e87c2fb9f239a5be86e7bd5c1f469d30f15ab4cdaddf43f99f4257d14cfa3300050081e6240018000000000000000000000000000000f8d7d97e3439f0c7abe5d5e973b46854cc582b5650b0ca1a6260c391c4489aa1d4e56f53a1e1822bd6699f4d51f3726dc59df8d9aeab1eb4743075a57aac9bb2e8c94edcc78f0f4f9f974b58bcbb20279f49659ebf3a73b2fadf0b9db8543d7ebf0c02c8009ba36e346d4ba3874ce94b73ab32db28b66ecdbdb174a807058ce6f725c1ac8b6cad92c55e4e921799c1e9f99b8f3dcfede7edcfe75b466eb8eab0a6c5d723d9bb2df5ea7d07a5f03ee69eefcf7a8f2f1dbab17abe7b797afbfc8de59522fc6be53a7b397b9ea7bef9a760bdd4556e6662428050e4498000000000000000000000000000000f8d7d97e3430113eaf97a6f5b0e1a0030c68489557826787540c2916e414d8c642ab10e21834aaece4f45b4c7839fbf9f9e8e2d76d58f5ceef0bd42bb94f4abd2c987bb821cbe775f951e6885e1d8db3a5e87976d7dac9d1d5737e5be9fc76b2580ede58001a35e5d9a6bbf9745d7d5a396eee932ed7a6e95a2fa7566edb56e5234c86b21835953c2fbf3dda9b6ca2d2b1ab6b35f23b594bcf61eff1771cce477f9bdb0c2d2fd318b6bb75166ec1d8a97a3774f53ed39bddf1f97bfd5f95f698d79c9d3c5bcbcec5b5e37e4475b16f0e36dca69f63de7cb7d465fac11f33313011e228e44c000c0000000000000000000000001f1afb2fc6863899f57cb31335ac8c107412b0d25eb95b2f2ad2981963e6d0a88b20eb2c4c8537a0a28d140aaabab8f073fa3cbcf4f26bb2bc7ab1ecbc77b557aaab436d615dca383e7bdaf272fc877e9ed72e8bfa59b6d66acb933d3e23cf6ac979e00d604c3c2cd99f5f3d5eeaede7b5b652f8d6f74b65cde97cab74d17e6f55b4d8a964817352e2d7a6d85af5bd573d2e57354d66c164558fa95d9f33c2f79e73ae7e592c8efc72ee9a9b37e6b2cf43afc0d5a5f59e365a86ff004fe57dbf3d7368af3eb1e055bb2e775a77e5d638f9dda9af85d4e3f41a6df6df33f5523d20ad261580acb34602000600000000000000000000007c6becbf1a189e0f57cacbd76572c39a43c8ad6d54d72ce982452cc92e89b105ad121a9b94e56eae5539f455164af5e78f9bc9eaf231d7cd465cfaa7b0f1fee29e908b343d6d026b5cc3174abdb1b69cf752389d7f3de7f4be7f45b56b8802ccdd569cb6be8bb9eba2caecc6d65e9ab1a4dd37e741dedcdc684b54cd120565376472bad4bc0cd612b3b154cf3543b354b6ab955ceed67d4fce39bedfc87a3969b974f4c8a98b16f439dbf4b4f5399e8475bd5793f71cf686ca6f0f353d2c18dbd0e3dd9b78f16bef7257c8d5c3ecc393d3c7d1d2ec77fc07a0c9df02215a2835368902300000000000000000000003e35f65f8d0cd2f1ebf9445b9c40f2a8924d55e12848533107020ab156236746aae22c9696d72a335ab931e4d7913cfe2f6789cfbb0a067d33e97f35fa45356ae7ead162c543555728a22dc87d0e5f438b0ebf3f99cbf3fa3c0a5d37c404d565e8f8a6b6bbf1a5f72dd8dacd756ae7ad96cdb9d4b56c5168e0969348beb82589615f7d1a6cd9623d91a66a899416356c765b5b8b24b2cf1fc1fd3bc874cbcb6aa6aefcdb5b3eed676e4d91a5abb9e77b27e83da78af63cf6b8c8fbe7f277f4b9d8dbd619d378d1c0f5fe6e5f13a7e6739f57bfe33d559cb666daaf47d3f07e964f62262251abaac9568c00c00000000000000000007c6becbf1a08c37afe4d5d5cd418e606355780a341424a849036822386b037b095c356e6955f50c983a58331ccf3fe8bce73f468ada33e8afd53e65f4ca576dc5228bd29ae56c3af0f4e80dcaed79dcbcfcaefcf9bd4f9b2db575f3465b85ac19a7d59afc69aefc0674ebe8f3ed9bf4f679ed39d3b9a38fbf37b2dcf74bb5ebb8daabb2167af0e4d4766790ba8dd9b36ad469e879fc557bad3e1bb197e9e79574aebe9c3a0f6dd9b51279df4f829f3be7f7b89df966daba5bca8bf15bb9bba7cdefc7def73e13d9e35beb5b37878f9e9f333b7b09cf171cfe77d8f9a5e3a73d62eeaf9bd83d067a791acf6d59f4b5f65d0f9dfbbcc680208f0b4b0898001800000000000000007c6becbf1a10cb3ebf9372038686543c014248a98288980ad0e748ee6b6a3a9d8994c48a4cfa738cb8b6e0cc60f37e8fccf3f4abaecaf3dfa3e95f32fb0579d6c5d0914ea13754c1e9b60eef3de878f96a5f4797ddf9ae6e8f3faf90bb32eeb9a4299ab14ba5664eae9cdf0dfb950e76a6797a7a7cbd5cf5ebe8e6ebc6dd0d393a3297274ea1e763b309e5dfb28aea8ad069b72ec298dbb2cf29fb2da8e7e9b8d4b74797d01b33bb1f95f31ef7c9ef3e5e9ae3b73d33176a3bbdef1de80ba3ef3c07bdc6ed5bcef9fcde4e871b1b7ba8cf1bc53cb7b3f2b2f859f4744f24e3e90d3c6ebd170a8e8f3cdf772a0be896f91f5b2c5623aecaecaa408c00c00000000000001f1afb2fc6844ccfafe4c9229310d29826b58889243051206b30e704c19239bc38b919652d765458f9dd2e5673c7e67d2799e7eaa4abe7bacfb37ca7e9b46cd6e7ad565a8f34db0664bc55cfe8e295af6ea9f2fd17c8f85f54f97ebcfaf5517efcfaef6d79d277d37f1e8d5757a31bc55b1a571737a1e76a79f314a3a9b78fd297d3ecf1faf8d364d9655872f4b9879303f30ee6e6967b3d0f3dd81d8df87516c9cf66a1da62a6d355da9d12ee33796f65ceabe7b56fc3df9b3df9b56b2a3d0703d269757e85f3cfa1f3dc893a73f9de47538d8dbe8115172cfe57dbf953e0d1a9552fcdea9e08e8dfac73707d6f36ae35dd29a55ebbcd364fa14723b18b8470128e000c00000000000001f1afb2fc683c93ebf938690d26642cccd7545d490ea132ba1c3ab41580d899558e4ae12d5955537509cbc8eaf2a6787ce7a3f37cbd7ada273dbddfa2f82f79a1b2eacb5e77ab68a745c91d4d159366b925f6b561d9e4fa6e7fcabebdf3565e73667e875f012d59c6acd9e71a7436f2273b7a0bbcc5a7e8b1f3dc66c9a32d9b7abc5e966bd375f89dde7d1bb464baa5e5743925c3e3f5b8da59d356be98f9fbaaa3a73fa7ebf8ff004d2bd9f4fe72bcb7f6b6e1d58bdfb39dbb53b1b2dfb9b69d11a9f9ff009ff4de7ba6193667eb75c3d247ade0558fe81f3efa1f2de243af3f0385d5e3e37fa0c41ac6bf21ed3c94660f55d295f3e8f59e3eba3765378d5ccefe4ab856762e1cbb3b4f160f79e4b565fb58c1d0cdc4c48003000000000000007c6becbf1a1601ebf926922b99853b089115bc156d2c22091048712af1c8f2ab8495c90c74e7be8938b9bd1e7c5cff0033e97ccf2f5a2433d9ea3dc790f6749c9ae8d3c1af16d1b288a467db92e866d197a734e85d4e8f1fd3d1e1fde7958fc26ba6eedf34b5bd59b312b54d97b3cdaa8ecf1e7477eec5673d79b643e746e973bad8d3d0f679fd5e5d56bac92e3db597038becb9557986ea67d470e8f45b371c0f6f9fa631eed8b974dd4366b769e65c5d3bb06fdcebb2ab771e53c87bdf9f75c29f53e5bd3ea3e99f39f4dceab27d03e7ff0043cdac875e6e179feb7179eff4194378b78df65e3a3f41d1e7ed565f23ea7c99d9667bb593667b8aa5ea2e5551ae90c9aba18587d1736e1d02275a000003000000000003e35f65f8d0ba49f67c993205aaf02b2b9d723250902b4a9c4ca9c3a5819d265580cb556815e6d1433c9cce8f3b2f9fe6bbbc2e5edacc4ce8f77e9fcdfa2b4f4d894e6f4b93d58084084b6b19ba59b5cd7a6f2de4fa65f37e97950f9a8f5efe7d3368ae3a0d161e76d8f9d706ab56332d95598682a7ec72fd0f3dfbfd3c5bb9ef2cac42da47996eaeac19fab40e7b68915e9acaaeaea05d6d3a05972dc936e7d5a9e8e8cdabae3ccf9b7d5be7bd33cfea53afc7a78bd5e164cf4763dd78af71e8f316623b72f07cff007bcfe37f7e83f4c57c77b3f211f775e6e9e5f1b95dbe1d7eb6dae2676ab201abb6a209155a1181024aada44d4a5a089940060040ac0001f1afb2fc68ef759f67c93ca31a8d5066a9c10ae9818090cf445968e1eb63765653356d2e6a752aaaba94e3e7f47999ae271fadc9e3eda4c4cdfdf7a0e277754a96e6a60e9e5d109824459126ba28bf3af652dafcbf4871fb1e199f9ba2ea35e2434db8d56d97ce8a4a4714ca548ac9a8875d8367a4e577f975eadb9f6470d75026cc569b67d5920b0b305aee0668d0b554f65a0d31aecc5cd6ea2bbe6fd4dda6ab7a64be23dc794a747a7c8eaf2df91e6fd7794cf6f73dd7cffdefa3c86513bf1f0fcefa2f398e8f7cd45bbc17c6faff00274ef75785af17770bb5c2a7b147899935c15c5481eca5c73fa15d725af5b2d57644d5192ce6e27b2dcddd5da05d2129e66738d5cba318fae9e37577d167c6bec9f1bd56892bf67c930b60ae58aeb6998a6480cad0089044c49c3c49b4829649950af5a4a2fcc33737a3cecbf3bcde87378fbcacb64d7e87dae67534d69be8ae9d155f0497a43bb2035e7dd9dfa15cc797e91be79f43f06c3cca5abaf1a6d4b39ecf0d19d6baecaeaad5aa221f6ea33ef5b65747bbc3ed73e9ec74795b6cf4285cd4a8bb466b2f2bd5f973a9b35d9ab1ebb4a06628b96fb2dae8d5a8b5c35165e96e95af5dba85f2deabc99ede9797ee72e8bbcbfa6e56763ddfcf3df7a7ccb4acf47270fcc7adf29cfa3dd32374c2cf19ed7c88edf4b9dd5c69cef3fe83810f47529c704bea891ae9d7cda5c4579468cfd1c173a27af5bc0ae316e593c96dfcfc61bf47235dd2fe1f7f965cca6dafcf955d7e307ecfe3bf49f9b7a37ba15bdff2acd122664b5041104c847590a122656010f01dabb1712ad2d5598abc9a730cb8b664cbf27874e5e3ef4cc4cd3ebba11b55567b690baa9b03536d634a5769af479bbf1d3b264f2fd13795f55cb65f36af467d7873656f8dad80ce895dc95e7cfab223a3d1c5d33c3461e76a3d8767c375f1b7b6dbc4ea6755f05ee78da9e2fb7f0be865fb8e45f8a5731eab72f55d4de9768b6c45c5b667523e95d623d8b2c46d2b2ea6cd43717b3cb1e635261e3dfea335d9b5cfc9fa67cbfe9de9e4680ebc9c0f39e8fcd73e8f71a28d5bc63c6faef3d5743a7c9ed634e5717d279c8fb29bacc73d5a5e763c1457cca376bf3e797a70dd74821ba02391a66d9864ecaec6af9e9d2cb8c52684c47369db8f8aa91d0adf19eb3c9d76c4cfd7f9c255830d2a22604c4c096ad842ba89895130493356eb6826508c8232df4962cba71e74f1d4db570f7cb134dafab5a4579940d5eb98f455757516d1acd36e3ddcfab548fe6fa09e5f4f123e659f663d7870e939bbdd2cc6aab7bab160eef3aaafd07962cf43125d56bec64efe757d19df3a6ed14e82cfcdec12a94d24ac5474b3417565d3568b12eb9bd8d6545c59a92c8bacc3d776933232679dbb153cbe1dd7f1f43ad4ecf3d705f71f32fa574caea7461de3c9a79098e9f6fb28d9d3939f82df3fcfafd274793d1b860cf560d57bce0f5bcbf7f33d5db590cd9b3172df564ab976fac989de5934f0b4e33ea81bd089067d3010ac0e451bb271e54a353739e2a69a322792f5de443bd6ff0063e76bb95ea975654a58b1c4448020a48604306a32266ca994ce92b9a5eb4ad36d0cf1e5bf263afc723271f7dba7cbf471fd006ab55556ea33db331d935954eccd719d3e67539f56a899f37bcb936663f9c73fb7c6d7854cccc2cba9b79ed75b4cadb977e5b2aaebb88b6b78777bfe73763a2f393d8cdf5f5d1a6a1a590b32e7555a8182cbc8cb92cb3aacaadd4db6576a5dd2ca4b44e94c08538b4d14c7d144e7be0e7f67c19eff004de4bd2a36ece4763b70f995a69e5e87afdb3bfd5e762f13f42f9ae35f4b6d17e165e775f8f6bbb969bbbf07a6e5ede5c997d146b2aa9bb3f9fd4f44dcde56387a7d4e35ecbd04f07a3db6da23eb400044c011c4e4c9d6e4e31e7e5e9f3bcf955e3bd878fc964a59f6be6d1e6038c2a0461092e4c2b190ac225583249087a9cda560e5254a335f98b1f3ba1cce7d7e562dab97bc7a4f39e84fdfa4d76955e02b44c6f32d55572b1b7439fd2e5ddb26bb387b4b4131f8df3bebfc8ebc7a219662f654f8d6d54aa5224d7b89826a8b469a6cdbc7d38e8f53bb957cdbada38417a93ce7a2b9427433eb1ced304e8cd2ab1e63bafcda6ab5ebb2cbbd6d4b2526a6478a92bb1214eae07771bd3f2efaafc9fa65d9f43e7bbdc74bacae3b799c6646c7a7eeba7cae9fb3cc3e5ff4af98e35f4fbf95bf8de7e6eec36b4ebcdd0edc1d8e574b06e3a3874e64461d98f87a3dae73e3e1c3ba2976347423afd2f4b077e892000000014dc173f2f65319793f17f4cf99f9b2b093ed7cc8d1226618ea61030c40980c68935698294b14a1a625c23c1c2b40a73dd4479b97d3e1f3ecf39313cfdb6f63e43d70f550c969d45120d1cdb55d554cb07774f9bd4e5e8daf5d9e7f62994b62e1f88fa0780d79f995d2f0ccc46349a5e901366954ecea5a5f1cd7468c9d06fd1d182dcf4edae37af23f4aa47a0e9781f4139fa0dc9d370e94e5becdd2b64a8b51c5b654f53ba3158415592a6942b88e359b735c737cf3def85bb75bbfe7bb5e7e9d252ddbcce43d6dcfd6f67d5f23e93d5e657f3efa47cd33a7a2d38f671ba716dc54d9d3c5abb70f6306dc9d23465ba992945f4f1eed011c79677f3adde1e89b933db4eb1866bda5135dc23da008c898a800b37c97ec5f1d91712beef9265680d2b0090120180e6b240789210429bab41844c6a8d0796ad3963c9c0ed798e5dfcf90e7ec59edbc47bca7a047a354f04409598deda2ca92bb283d9d9e277b8fa6ccb3c3d6a6c59929f36fa7f81bc9c1474d7981066d6ab10e7454c75d15d369b445ebd1d3e7eecf56875d19d9fb79376a74cd575cd32f5ae93f39ddeb38195d1d9cbdacba17e3d753b2b1bd9530b5ab6b36ca354d0b353bd6dbc5e20edcdc5f01f45f9bf3e9eaf678fddf276565b577f2f97311cbd9ef75bceeaebe7f4fc3fa4f36af417553c6edc1b71f48f45469d3d382ecfaa9eaaa64bb265cfbb273ea89133cd7d3af1eb9f63f37bba2b7bb5eab259a66bcda61ed4816c000003e39f63f8e0b1eb7f6fc78ad349952004894602ba39cc006982398240342ab192092c8170ecc52b1792f5de2f8fab5818f4edfa07cff00e8b5f4ab9af4ec84b003d502d4711469acecf43e73bbe7f5af22397a6b3131e9f25ebb92e3f99d77d3d3ca5823342d912a149979ae6b823dd6cba743e99a536b56ad1b399b63ea6be57487435737427a19ad6ab989d1ca1b565b4b5352c2e6a9cad7adaab25026949aaeb29b7b734ab53d79f0fccfe95f32e5d7dfec71fade3edbaa69ebe57221933ebefd39b5eb8d383dee0d3bd767d38b6e475397a8f67a79fa3a71687ab6758c7a0e7739dcbcbeaf8f4e3bf597d35cc9b62f24f67906dfa29e367eba7a1387a474c47b4000202922ba5bf1cfa77cc732cf07bbe49992434c00050e0a2591c44c49ab814481b4344b8ad810af5caa716ec1164f19ea7cc71f6ea031dcdf50f9b7d2a8d2869bbe6d06d5b570b5e9d51d536511b7778dd7e1ecdf0272f459ebb0ad80ce3f33e57bcf0bd3cba6262e2c119d11a1a37b92ecddbae8be6966acd6aadcdb263ab536c155d6350d15b968bb25d55d9de0aa9121a6ca6d165953d2e6adaa785a8ae7aae26aacc7d79ae6e11ac7a5f34f6fe1f3d1e8ba7cdd9e3eed330d7cbe651ab26fd4eae8aafdf22f03d0f0b4ba7bf9fd4e7ad1c9ef70371ee3abc2ef77e6cd82ad19cfcb5fe90e1d1cadf87770cf470fd0726e1933dbabd1cdc8d49a733835e9e79f44e4e9cbe9f4f86fd9fa2ab96fa7d23975f45d7380c57f86f61e3f116c87d3f991a010ea0986838956292242b0c513286e01cab2a96488c5163ab06ec31f33cbfa4f35c3ddac833d9d3f71e3fd552fb33dda6d6d4e6f128174d1647b6ee6b62efeae6d9c3da681b9f7c595bc967aac992fccfe9fc5b87cd4ba9e9e588cb9a97ade55d6d132f4db9095b3573ba12f76ac9aa5dfb326d2b5daed4e7b2d7199ed50a3404aed8816a38b1eb9174d2d465562b6fa74d98cdaf2f4e7e2a5ef72c1e37dbf8c9b7a0b6ab3cbdfa9e99d797973dd9b5e9fa3d39b775e1a385e9b89a4bdbe17a4e5d54f03d2a6b3cbe839ba3865b73d97f6acadb535973673d9e1cba7c5eef37be5ccb08e98ae99b2cefc73caa69a35460e75da1b272eddb5175b1f2b0f75d5cda6d1c9e37a1f3d26f227eb7cc8051a083899820901332165580130025528d070cb3296b7ae1464d196571385dbf3fc3de41a33d7e93d1f9ff45471aaadedcf652e85932ca9e164ab4ad3d5e574bcdefe82ab31d5234421d67316454c8f13e63eb3f38d7272a1975c2029b95cc76d94dd2afe860d59d3a1ab0d99d3a1bb95b8ba7a39d7ea76be5b697aac854b298e652216881db080b0a985975370bb4517ea1d67175e65ad29d655f86f6fe2b3b7709b7cfe85da345ddfcce6717d2f9ac77fa5eae1ef74e6c393aeb1f3f60dc7ab3c7526e58f7db66f8f36b5b37135da94f31e828d1e777f1fa5cde99f1d6b79c99b4e339aebf2b5b55a72ebe557bede6ac3a95ad74baa9cf08266aea785f4de67a9a00fabf2d131150d12a525434c4930a019641320982659130712b0708d5c33e6ba8cd79de176391e7fa1598274fafed71fb14baa62b8b15ab9200e5442f7aac56de8e0d9e5fa3b651b1d8f2b08dd19e9986d8c8c35e7a6cce7f35e6fd73e63ae1e728bbe59118aebf25d9bdfa31ecc6b735562afd7cab0fbfa387bc74ecc1a0b6cd0c2e4840d0911da57076cd4e6ee9642cbeaba97595d962ce6f4b9fd79f225ebacabf1bee3c7dd3769cfdaf3fa1b1fa35f7e2e55da238f65a5bb2ce5bba16f4e6c1b61b58aa5f5a723aa705b017b2649a4cb152073f7f1a4618e4e872ed98bb925ab55525edbf357ccc1e8f365645cb8e1dc383db285d38b06df33e83cff0057a203edfcb112694cc11c44c859980d12148488980310b2ec595500a454f4c79f2ebc99d3cb7377f3bcff0047017b5f59d7e475d52d5351d94ad92520e2486d145aae9ebc9afcbf4b2e939ec7522299472694b08987ce74bdf9738fcaf0fadf25d7c859acd6575995a3dfab9f7674e9be2b736f115c376be4693ecece3eb3ec5dcbbcb72e7b4ec208c2663665737b2bb459753752db6abacdda72ddbcef490b2713d125303eeb31a70eeebc4d7269d36f5e5af4d5675c26626ca32b46d55954515cb426c46aabc5af0e4d112919cce8f3a4f88afa1af9f272737b1e36565d34d5da7d39e47adcceb3e3df90e4768879c3abcb0b5d3a366ce1f638f877cc47ddf942404c486434088990d12112492841cc4a2ac8958e1480536531d593562cede6b97ab279be9648b55eeaf46b4cc93479a9e3920a0c934b591e575b564d1e4faa79ada74b91052cb2563d7648194ccdc5648f3df3cfa97cbf7e7664b2bdf9acd5b9d97e7bb3a6dd1934e3471da3aedb6f559b6ad71db72584ce80711a53cc49b3a30b2da5c5f765d22eba8b74ae945d67b9f9bbaa78943794b0a6642250a9e566cb4a2d2e7cc169aeb2cdad43a6d842a5c5b72c565765792bc5a73a7c9f57cef47cdcfbf99b3958366f8c7e88dbc4d356e2aecf05794fb98cb36adac6c9c9d7772f91daf1c1d8bc83ee7ca4c4c1bc0193120824a40225649a00e15a25cc48212c515e7d198e8c5af9fcfa3cce3d59fcff004abab2ee3f656d36ea8220d99483158764abd56356f2fb76d76793eb6481bb41053654e563d5322c1222b2120e3e5bf52f9dde1e2556274f0d1a205b6e7b31a6bd7cebf37d0b3269cde9d39af56ed5834c35cada63ccca1eb6558c9313bd6e1dd26abefa2f16bd175572357b8cb666b8711bb9e6f9f4753a3f35bb3bfd5b4fc974eb0fa71e0b65cfda59e5fa5bcbaeb4cea2d9a1eab0452ba6a7a9e09a8862a51c8a9a76cd5e5cf4e48f198fdf4667c6713e8f8339f80bbdb71751e6ce8d5223bde67b956b9cd67057cae8e6b8dc4f5de4645f2b3fa2f969820e424c9801312260089020955484282244ab24133e8ce32f27abc3e5d9e75abb387d1d7d8e37a33eddb45daa7520a656442cc473667b6965953cd7d1323f93ebc0568cc8c432cc259089c58268a32d3a3e327cb6bccae08d78b11202c8bf3716d9a71ad5aedd39b4d36db9b8de5c6cf5c9b0ab1b3249daf5b1592ae4f656c2eb68b6abedaacaadcf6e2d4d42a434d98e4aef25ea97a3f9c6fa7cd77cfda73bbcbb7cdbf8f5f83d8f43b3c8be63dceef9f5d70fa5ebf985b71faadbf2ee8eb1fa1378ee86f2f473cbdda9bda96d4dcd53d4d30d64866d4d31a20b34de0c53b2065cfd0487233f7893c07ec26278be1fea1f2f8ad986fabf140070d0184cd62c914cc0520056051130a095264658eba2fcf0c7e7fbbe7797a3c710e3ef1ea3cc7ac1d17adf4e4820c294959831958defcfa33b7a0953c9f6130429e564a662034279767ea381e139fd3ccf4dc0c8bd3cc6df45f8c6c82204c01f4e4bb37d0e872ba9cb7dda736fceb65b3747335c07aa61560a0b1aa716356c2d7a2c2b9eb62bada2dab45b45d537336e12842b95642407aeac431798e9f33d5cfd3f4be4ba9f53c8ebf9fd583975e6afb9cff1fb58c23cde80110b2dcc48e8dbc989977b4f98967ed3a7f3fb6e3f4bea7ca34eb1fb0e9f8dedd63f596f99f47a65ef63caf4779f667369d4b0410482aaf4d2081897e45f60f8f8b6267ddf0f201cc4b2a196c55444a58204912256432203909056f542aa3466862f39e8bcb71f579a4372f68f5de47d98d535d9a6d0aa2c1184aca1b354c2dd78ba18eaed111e4fb09956369c9e2f5cbed7c7f8da7af93bb1d73bf36488b99a2ad5cdb588f9a6090a4902c47957f4f93af1af77a7c6eb73e8df2eb1c556541a6a255d15352d9470d6d3642cb2ab0ac6adcadd145da573d5229a1aa2458894c938e15702ef33db375ceff4fcae95dceabae5d2d9cbe8ea6eae9e4c7ec314d9cbb3911e9b97e3f67964c70ef8082022cc9021a504d9765993bf472251ddbbce0cfd3ebf1f6dcbdd747e7975cbe99d3f93e9b9fd7f5fc6b46b3fae9f33e8ea3ddfc77dc787d4db2b3eff0085681804c2a48935689034402602024d6404c1216bb2b1565d7932f9fe67d1f95e1ece42c4e5ebd9ec3c6fb4aad9adb4da21433d2d0622544a4d56f4b91dae7ddd39c3e37cff0049ed3c9791a3af8f7d30bbf3240b9c34488068edbd5f96b2e8c4f313090695034c71a6ab25f57b9c2ea72dfacd86f97752f0059a255e56c2eb29b4ec74727757267562b9eab2ab6b9a82d4f40822933cfa793eb95f9167e879b6ca51d33b34d37e96d7ab06a357374e5cd7a07e17a9dcf2bafe5661eeb9bc7ebf2ece6afaae3793d9e6c31c7b5490440498988b2d29252445869412e2153cd709d17629474afe389ef74bc77b1936c87d6fcd6662030d071240921888902b238014e4004c0151d0abc9b3166b9de4fd4f91f37bad43ce7d23d9f8ff005b4b5926b640844c49b88509cdc73ed73fcfd32efa148c80921200004ac82d4bf376b49cb48904bb238791f3a434b4a9d34dd9adfd0e67433aeabb2db9bbd6b039592ad6adc5d6d560b2c4b09dd5899d1858f53d535880a5b308f319fccf7c6ca8b3dfe742c5761ed1f61ab0e9d4c53599762411d7e87cd756ab395bf9e577adf0fa4fd377385d9ed9743858fadc7b3849ed783e3f678f0ebc3b54084491511309900800880b3130599008f67e33d98be223eafe5ad3006956041215e24a566044c49100020ac224e15d22a726acf9d39fe2bd5793f37d0cca367b777a8e674b434047041426be61f4791c9a29752b119019a0084c009000008689165d5dfcf5b2439e8b0cb619ebb05b62598d19a5f3717556c7ab5e2d12f65996dcddd35076cd731df6e7bceebaab4ae7aec267460d292560b01ab8e6e969f138f8fe9e67957f670caa55535f5cd2eb4cdb92dad61115b65db021d7a72590d39daaa21062b77b0f15eb7be1d1e475b3f7cf0fb0f117e4f4bcfdf931d1e7d3d6f0bc1eef3a1d7cfe8444c441208262a801204266262c9ed3c5fb42b51d7eb7e56c2b91215cc1313292412a51313540002039088e6a653ab16ce7635e179eeff9ff0037d213139eae9fa4f3bdfd2b1556b29e771e9ab0429841288080046121404c600000131355fa33eae3bb1318b55754c595bd57dd45f8d2db6ab71a4b121eea1e56abb1db2f4ce778ef6a6c8efbe8d02fbaab458e8c1e502b25105b460f13d23bde46b5f770122f6c1ab4839b9023465dda5392ecf55b54d59736556c7293501ab32ec450c98b8fa5e9791d4f572e8c5979ba5d1d1c7b72fa7d3d9c6dc772781e9cb99e7fd9d7e4f5bc59d0c1e1f7422316c48481154c0113011ed3c5fb416a4c7d7fc99a61c01149224a40491302242a2240044712446ab2a28c1bb0f3e8f3dc2ecf1bcff484c4e7a7addbe27734270ede256c9115cc0460440023909a88980019600000000bf6f3ba38d6624e5a2ab41434495b7e7d19bbaeaaec693321aba90b1e993d0f9ac8f4df974cbd3a72e98efb68b85cd5c872ae6d9e879ff3dc7f4f3eace47b385e16bb2f5ac9cbc0251585d7d51b98ac5cb95263695802c447304473011cdf468d4f53a7c7d3e9e7b39cf8336cf9f5f3bf47e9fc8fa3f4f2f079fdbf352bb1d2f33e9077b9b977e75f329ed3ca7cefa1cd311c7b0898000513009f69e2bda8721bebfe464c4d08029980a6602908a4c000232490562c86a96550a306ec3cfa7ccf2b7f3fcff4c4c4e76ef69a397a30a1168890c023802048d5112b544c4e68020000898124489dfcfd11ee865e1d10aca0656165d45d97a6fa2fce8f24c68ae805105b766be1a7563d52f65d9ed957dd971d5d8c9e4b87db1f45e7a87f57240474c5d22b0d1126324874888dadadf52e8a9492272e4804a8b1c904644c40986a4eaa2fdc698a72f487ad6ce5a5bd1cfd4eb95fd2e665ef8ece35db7159bb199f4ba4b928dceceef8fe9e68e57a9a7c7ec79b8baaf17aea4c4a20807b7f11edcde627ebfe4211209800055328e5304149135c04642262924409aacaa567c1bb9dcfafcae2df83cdf4d0cb2d3a1ccbf3e9c00a2098c808130d54c8ba429386011800000400254834a94e8dbcdd9cf5ba1679e90c922db69bb2f468cd7e74be51a1285616b2a1768c4f574b479fc9a5eb707975ed97479e877e7916352d29019608c0049120220130c6c2c5531131c8414c0a7301900230012cafa9b044d29889cb3665b74bafa79dabd1867cdab2c7a3b7c5bf4baf4e0b770a46c86aed706753e9aae0df67abc5ea6de5d3e217d7795f9fefd4ae9c7b0f71e1fdc44f247d8fc909010040226832b2656621240082344c4c426002d37519bcfcee873b9f679ac1b3270fa4874b1a575b2aa005131308004b06e61432c09cb0000000000088658484d09805af9e23d2f94cdeebb9a66bb3670e257797860eb5182353b133cee2d44350106d4ca84d11026220491260442489124409020c11a444c464c024828406400cb0000146959d490070cac25ebb2ceb9ca758d4f4d7568cf44629ba15f5ba45d739df08aebc635b63d8346ecd7ea77b67c92b9f8bd9f97f9bf418fdc787f71e6f41e567ebfe4720085655491252d1205652022912b3090cd2f52bd698a2ea2567e774789cbd0f3b4db571fa2986ad4810b008c000d0d54a1140270c000000000000011242262680008904120898292402660a490149052488124009204c0090804c118042422a008e660a820004c700694844601900000000a0010018cb3534c1a4cd5953d7065cdf4f436b6f4a99f5f25dccc7871a694cfaf968fd7cdbfbe1b3564d1d72d9bf8dbcba7cfe82e6fc07b5e7747e5fd234a1f47f30b0ac8dd60368809daa0ad5403c28248239e6748cf43a06b15a34997cce2fad397abf2e5fa99cbddf96d3f582bf9347d68ce9f253eb40f929f5a07ca0fab9a9f9347d68cd7c98fac90f931f5907c98fac83e4c7d641f263eb20f931f5907c98fac83e4c7d641f263eb20f931f5907c98fac83e4b3f5907c94fad03e4a7d681f253eb453e4a7d681f253eb40f92cfd641f268fad157c967eb21fc94fad10f92cfd6487c94fad14f929f5a21f253eb453e4a7d681f253eb40f929f5a07c94fad157c94fad11fc94fad10f929f5a07c94fad03e4a7d681f253eb40f929f5a07c95beb0697c9e3eb253e4c7d6487c967eb247f31eb7b83d3cfe378bf4c36be507d5cf3f47cc77fbf3b73f8bd1eb0ed97937f526e3ce74ba2559ef9136d407ffda0008010100010502f2b438f04c8cefca51b8e3610b958b162c58b162c62626258b162c58b7c39ef1d948522e665f8645cb97132e64645cc8c8c8ea23332dae5c4cc8c8b972e5cb8c5e2b162de2ee5f6bfc09438c665f8b43891fd15cbef7de5eb82dd2f8929584eff26e5f6bed72fb5cbfc3711ae099195f95865f95cb972e5cb972e5cb972fe2b161231313131312c58b162dc225851313131313030301f6146e6060606061bdc82c8e933a4748a90b118d851b9d267499d267499d33a4ce933a674ce99d2674d980e3b6260606074ce99d33a63a573a63a6ce998981898981818187c2711c78c67ca4ae35613e562c5bf454c4c4cb99172e5cc8c87632322e5cc8c8ba2e86e2c8bb1999a331d9885232333332323232322fb64645f8aec5c6c4cc8b972e5cb8fb97dbd19190e466fe1b44a1c63213e2d18d85fa697bda9885fa2bf3bef72fb5cb972fbe45cbef71bf8ae25b826467cdbb19172fbdcb972e5cb972e5cbf92dc2c5b6b6cd92de98842dd2de258684d962c38b2116de0cc49220ae624ee88a662cc58d34469b5b6262cc4b095cc598b30662626262493445dcc4c469912c5b6cf6b162c623ec45dcb16311af8cd0e3c63313e3515cb344795be4d8b18989256de989885c92df1e725712b6d617062a6917df1176dafb3e0fb96dbb9dcc5dd27b344616dbbed7da716c8ac47265d8e4c751fc871e2a5614b831ab96b0bf4553d6d0d97c0bf92fb5cb97dafb5cb8c5b5f85cb97f031ef3b727f0dc46b6bef19f3ccccc8bf3b97f8972e4b787b42e362c58c4c4c76b180d16674c6ac63612b981d31ac44ae6060cc19818988d08c4c4c4c4976177312c5b6b162c5c5dcb16ddb2c5b77b32a3f94d0e3c633171946fb44b71b162c5b6b16f8561c78ae0b95c6c4ccee5f6b97dae64647b11917332e5c7b2dae5cb925723dbc181dcbb3b9dcbed9998e664363912a8c73f98e3bdf65214afc5a1762fe2bfc57ba23e16c5b7b2e46e5f6ff4cac67bb32f137e0bf82c58b163131da44893f9b28ee9eea7ca46627e4b97dae5cb973232322e646464645cb8f75eb2323233148c8c87232464296cb6c90c4c4cbec8724645c65cba32132e5cb9921cc9f71332323232321b2e6466398a6750ea1d44754ea214c750ea0ea0ea12aa8931bf9cd0d6d72fb465ca5117cb7b3de2246260626258b16d92e56f8362c5b7b162c58c4c4c4c0c0e99d33a66074cc0c4c4e9b1d224ac31bfd05871defb29197168bd8cb7b162c58b16dadf02e3de05cc8ccc8b972fb64645c72d9b331972fc5f6132db65e0c8bb972b8e6873dafb4ea1045cbf0648a8c63fd14b929f1b12891e172e5cc8c8c8c8c8c8c8c8c91745d174763b1d8ec3b1d87625bc0933214889182304608c50a1131461130896474e22823146113089d381d388a1146113189823043844e944c518a1c50a262346074cc0c118989d3660748e89d3b18b312ccc5967bf72f21b90ea48736363fd131f38c8bf17116d62c58b162c6262cb189898b31662cc598b2c5998b316626074c74def12a7b70b1620fba7c50f6b6f62db3e162db5bc37f1dfc0d8c63de31fd03197dee5f74297273b0a6265cbf8d97e372e5c72b0ddd912a7b97bb14ff28d8ec76dbb1d8b2314591d2434244a173a488d148c0740e891a274ae74923a48e944e8a3a28e823a313a513a08e8a3e9d1d047411f4e7d31f4e2a07d392d39f4c7d3b3e9d9d0674642a123a121d290e2cb318c7ba4256fd03e70ee356131632148bf068b585f1252b0eb3674d9256dea2bb946cc5eede5b97323b9dcbb3265d9dcf464cea32ecc999332666cea333666cea33a8cea33aaceab3acceb33acceb33a8ceab3acceb1d61d41cc6c731ec88afd14d24f8fa2a4324d5b752b1909f0bd8ea214b92f14aac623ab2990d316487635314b7a5de737dc5ed44503046060608c11823030303a62a63a373a28fa742a474874454d1d247491d247491d3b91a47490e2604a911a4748e89d13a4744e8b254ec2a2744953b10a5267419d0674247419d163a6c9cd2316c7bc57e89f829d42a2ef25c6e646465b2763a8ceb33acceb9f507d49f527d4a3ea51f5313ea627d444ebc475e24f50e44214cce26713343923553bef49da72a88ea22f7684cc8c8c8b972e5cb972e5cb972ff16fbdcb991732321ccadaa511e7545150273dd6fa4a39bf9f2f0dee4ff4dd591d799f5133ea667d54cfab99f5933eb647d748fad912d7367d6bb7d79f5a8faceff5d12a6b1323ab8d96ae99f594cfaca67d5c0fab88b5303ea299f5103af03aeafd5429dcccc909f92ad68d31cea5623463024ca8c7cb4ff8fcf9faf045d892ff00e1ae64ccd9d491d590ab48fa899f5333ea667d4ccfaa912d44d89d8fa863ac390cb162dbc511aa97e827c172bbff00ef6a705cae87a46d38db858b16313131313131312c58b162c5bffa89f05ce956940752324f7c7b38ed4ec4e9e2257dac58b091d33a4744e8b3a2ce8b3a2ce99d3303030303030301f38c6e3a474cc4b162c58b162c5b6b16ff00e1e7c1792dd8489222d8fb09f18f368b1631313131304578a49f2841c9d3a3894e8288f4f167d244fa247d0a3e84fa267d1c8fa399f4733e8e67d2ccfa599f4d33e9e67d3ccfa799d099d191d291d3660606262626262626262626234246262626262626258b162c5bf4d3e0bc71f73435b5b672312d6e1076f34a762ad6cf953a4e6429a891763333323232322e5cb97322e5cb97e172e5cbef63146113a513a103e9e07d3c0fa780f4f02ba825d1749fd2c4fa547d2a3e90fa53a04a958c917dac58c19831c6c58c4c7f413e0b95f8d2fca5176dadb4e22ec31313d999594677f1ce6a2aad5753952a2e6461612dade1b72b6d6dac58b162c58b162c58b161c6e742254a39aab39535a19651c4c4c4711a2a46e3844b18ed1891572d62be9a5250a6dae91d2fd04b8478a8b7ca97e4ff00ab8d8c47112dadb2ec29a14bc152aa829d4737c68d0cced129fc06477bfc0b9fc8772a52745c75e999190e4498c977231da14f23a484ac2ec39dd51abf6f50ea7e81f08f14da72efc68fe57ff9f92c49107669df8dca95b025272e5434f96d1a7de027e793179efbdcb9287d4ce85ea52a0e2e3a79e12c894c93253211da10b8a36da28ec7629c55ec8b2fd04b847c7a7fcab431f332c64d14aa5f856aca03efca869cbed1f71f856f85629568d27a3a76855d32993a0e8ba75549364e628dcb0a37231b6d18dcc4c0c0a6b296063fa07c21e3d1fe755e52f3ca2215613b95b518f3a1a6b171ecbdc3e047e1db6d643eeb0c9c724a1697508ade953c4b163b9dcc9939ca6d7da64cc9fe81f0878f49da55616979ec3458759db8a572869f01bd9ec8ff007cd505f16a675e542b3a91648ab1b9de4e2edb51a56dee64644aa58a0d63745d17f9ec7c21e3d28fb2f80c9cefca317274a8aa7c1eebdf9a4c4f9dcb97e572e5cb9732348ec68bf094893252c89409cae69695f6f658b162c4976a51fb713131f9ec7c21e3a3eb3fb579d952a65ca9d37374e9aa6b83dd7bf35be2f627420cec86c94c4b6a547317ff00ce466a476e163532c634d28aba3289947e7b1f087af151f4fcf29624ea65ca951750fb68acafc591f4c5d9fccbf81b1c89d412da9c33794604e7092fa8a6855e9b3ad4cce26687548cb39e713ab13a911d48fcf7c63e3a3ebcd39a8939e5ca8d0cc9495352771546855d9d667558aa1d421f8939e32558eaa3ac8eb23aa8eaa3aa8ea23a88ea23aa8ea23a88ea2334668cd192324648c9192324648c9192324648ce26713389d489d489d489d489d588eaa25556cea9d4664f92a8d1d5675599172e5c7f3df187af151f4fcb52a2812965ca869f21cac490d0d0c52e147f166a3f25e6bed72e5cb9919191919191919191919172e5cb971bd9bb96fd73e2976f152ec98d78ea56c06efca8e986f7711a1adae645cd3fe2cd47e5b5cb972e5cb9919191919a334668ea2334668cd19a32322e5cb973b96662625b93defbd8b162c5bf4cc7c17929fe23e16e55ab5b92572869f11be2d0d0d6d713348fed66adda599d4333a8750ccccea23ac8eb44eac4ccbefdcb33130312de0b18989818181892e5185c9ab3e0b8afd0325eb75e4a5ebfdf0d6afc946e51a180f9b44e0496fa17f69af959f5199b32dfb9630304628b2e56313130303030303a66060626260626262749938b43e30a791da048b16f997178d92f5baf252f4bc35abe5ca11c9d2a2a07f9cb1de70251db437b9aff0065f858b18989898981896312c58b162c58b162c58b181d362d3c85a499f4523e8644b47826489d152274f1dac2a77232b22c6062625bc16f868bf8993e10f6217863eb9dd2556b67ca31b919aa6beb50f5c7d43b2d4b646a450eb288aba62926225b344e992563f8f7f733588c4c4b0a25b9284854a474642a0c5405a767d2499f42cfa0685fc6b17f1c7ff9e85a081f454cfa5a62a30460b94d64a486994fd38e454a3890a571c844293992a189d23a67489406b9588d27f21be2f69fade97bf1c3d729c940a955cf9243ac39dcb9f91733331d56426f28d4efd568faa3ea21215545ae6a291a6974e4ebc4ad53315191f4f33e8ea0b4333e859f444a14e247a4c55298eac6250af0a928e8e08fa781d2896e152392a72baf2ea29d9ce247d58b5ca9d8b0a9334ba6c50e098a9450e9c59fc841224b8a230b94b4904bc762c5bc4f932a70a7efc2c48a5dd47bf1a951414ea39bdee5c52252bf2722fba911635b7728ea6c4319aaadc2551fddd382708c4c50e94a9ba7594ca94ee4a9d9ce9292fe3b4ff754859c5dcc717a1d67392211c7cd28e4ab52c47d8eaa212b956175474d73e995f8ff0021ee63e0914217953565f22db32c31bef3e14bdeeb931f65497db1f5b32b5654c9cdc9ef72fe65b5f6442a4a0757271d55dc6af7855ed177daa515315570250b95e95969fbcebed0773f17a3d5e5e06ede69c14956d3e23a252862423770828f3d6c7ec9231151933e9e67d34c54248d346d3f836f2327ee5c28f25c2c345323b23515d531bbeed97f12ddf0b0b65b445dca7a9c4a7aa8943598b8bba1ab984a98daab1d321c339548383446592fc4d26ab3e73fb48cafe79e991d2651a56f06a5e6969a22c119198e7623513da9caff0016dc9ecc913e14576e0b8ff9123d944657d4e3c1f9917dec2e2842b356c4a756c69f5168c2b11927b6b5631d2377cb09b8d2d5c6b69a544f445a91de2f4ba9cf9357251c55395d7c771b152192e8b47a2e60d90a02a6d8a36f8d62c5b8b193e14bf1f0bf51ee4a0c5ef53aabf0bf9bdf1c8b97ed7dd088f62ead621216a7028ebc84eeb5abfe5a6fcba1d414e746547571acb53a2c0be2d3c945e269b53d4e538e4a95d3f918a3a48e944e944c579ede67c1937c29fae1fe887bc44cafa9cb765fcd7d9f8d7ac88bb8e47b19977d36ae54ca95e352950f7a38ddd6a0a44e84a91a7d6d96a34ca6a5169cff0028c9c5e9f51d55cbfdfd32f35b6b716325c21e87c10b65ea1edcb12a5773e12f96894f6f437dd7727d88908b6e8d7935a3977d0fb9472251b15b49729d495372c6a9aafb25179909389a7aeaa2fdfb18c64f843d715d845ae32f812965c1f9ec58c4503a66032c58b78625465c5262875254256a9a6bde352e4a391283813a4aa15a9ca9cf53959d3c44f254e6e0e8565517e9d735e0b6cfc0c64f74587c6e223eaacf12f7e0c93f258513031144c054cc4e99d31c0e98e058b16d96e84ec484cb90914e589a2634a47781da6a548acaef52ae46434295ca551c0a355545fac7f0992244f787e43e3722fbd7a8945bbf193f1a458b0a228988a26258b1631314381d144a892a46263bdb77bc7b9d4b1a6d5d9c2a265c70333510fbab7bab4548945c46852b946b383a555545fa9b5fcef7b6ec913de97e4863d9ec86f9bf0d84851312c22c25cd6d62c3a44e9188e909087d8bef63d0999c6242a28ca9d4b971ab93728cab7b64a37274ac329942b383a73535fb17e363193de8fe4318c7e04ae746ca7ef9a428896f61217348b16dac385c9532701c0921a1ed93d91ec7dc451a963473ea9d677b9a85f7d7f77d9ab9a8a46182b5ca15b0213535c1afdbb24327be9ff36bb3dd8f928dc851702a3769befc9212122dc57345b8d8944c4ab4fb589477712c6372314b67d8d2ea6515a7aaed04ed56aa94eafe53a6e23da71baad1fb632c4f6a85674dc26a4bf68f9324325be93f27b5b663e308393a54711c0ad2c64df2484842e69715e0b128932dde711adafd9b29b684c6ee2836234f531295ed597df57da92913a438929b815ff17055057a6334f5b0232525fb77b3244896fa35dd89161a1a25c29d37370a6a24158a9dca92bf2425b21725e7921c7bc90ddc9c4b6e8bed14ed5a3f7699e32d3cecb50bfe93fca54d32ee2382915e24fd4a0e237925f689f6d3d7e989dff5ccb715c10c91225be8116122c624898b6a74328c20a2451fe6aaaf6e496cb9216cbc4b8c9138128188d5b8a20fb3f7469e4e9c2c548b8cea7e5b3a656ac4f69d3b8fb107d8a55f08277fd3dbc16e2c7bb19225bff1ebb3312463658dcaaac43b94e8768b5b224ecb5bf97142f1217c068942e5581245bbfbde285d92651d462e9578c96a57df3f78b88a77db551fba5e9ed282914e97752c5bfeaa15f0fd3df95f77c5add92263dff8ff00c7fcda48c0ab4ae52a1615229ada68ab368ab2ca5c1085cd6e85f05c4712b52b6cbbef1761f6747dafb5e9dd875729cbd8e372d2895aa4644976941a2db423f7548ddd097fcdab10af8afd32e0c688f37bb2454e1a27f65f7b88f6a2bbc2572db58d5cbb4fdf05cac21212dd7c368942eab53c5ffab6a64fb34a2ca7351752ab34dea7efa9613beda987ddff009ba912a4345295e57c2518464a33b16ff9d3af8afd53170b08687b58632b70d1c7fe7c176db13d1195c4ca92b1aaee3e0b92dac2f1adede1b1635302db7bda71b892446d68bed4ac4b6c0cec6a2d2da50b97712ca446369ea26d4a8c5951a6518fd92ed4f4b57edfd3b1f38ecc631922b7bdf4dfd59716363643d39da51ab735589256e0b921795796c56812888a4d276ef28d874ef04ca70ed4e389504efbea297dd7fb76a948a3377ab3517a7a9df5145cca71b497df4b4e46b7ddf2ac5bcbecf5ba1eef6648657f7b2283ff0098867a1ecd6cbf19ab6da9aadf816e842f05b7422e265fc73457a7c27d8a1248ba427f74677731c133ee429a35512dd9c0c9a13b98da7aa8b9ca9465467565284e1279528b51a2ae4dfdda7ad9afd23defc10f8c89122b7bb0f6a0aca3df796d62c2463dabfba6af2d6a717cd6c8426265f65b2e121c8ea1d5b1f524b567d6323ac16a2e2ad732322e27b2d995e24d0cb7715d6ce450456ddab9a8524f2bc36a948a336db1cf13534e3293ed2ffd51fca5ddd37628d5ea2fd1be285ba2d6dd8c654f7b58d37f5b11fe47dec8ff004a8f27463dff009085e2f75c2e64667545545545314852e53242d9c4e95c546e4a8183445c910aa65713109917bd48dcab1c76ff0022ae9ab3210446d8d62cccb6d544b7db8193427731b4ea4a5954bdb5dde52ff9472ffb69aa3ea4a7f7a2954719426a6bf4eb82dfd8c6327de5277d93b1a75ff2f7bc4ff5ecd77b15158d3abbd6125bae172fb5b64222c4cb97e1243818180a05b6458c0e8a3a4242bada2c5b48ab0250b6d2fc6526f6a0949d5f753d6d63573921caf1da74ee5393beaaa3835acb2d44a1235517284bbd48536a73a2f2853713a7de9cba646592d98be75b65e165ac325b4fdef158ab0f6ff10f76ec55fc74cbbeba2ed3b7354db1513a474ce99809084c4c4445b3458b6cd972e26210b6b1896da3bc915fdb13b16c99426e23fbcabf8df7d61ff8c5a332e3fcf517c950b2d67a8a518395894bbd462aa8554ea9a4affa05e66324325ef68f7631f725c188a889fe3a74caa94955a4310f6485112116311c070dee45888b23bb431b24cb971488cd0a688d996e1623bb573514fbfa1adfd1455e357f1df593b09de3b4a95c8ce57d4b6a50fe4668ab5d4e12b4e9d46d53d576a9ee107b24411a7adfa05e1b706324c63df491caadfb4b667b537b3203f6ff001821a2b2ed25623ec484b642627bb89288f68b1104444586899264a464642990991302cd19ee8425bd58dd49587d8910fb8c336a38157f0df5abbc7f0ee65b3fecad49ce7ffe6ce25585a2d6546ac538578273a723b19199195cc8d3d7cff4eb8b192243df43fda863d90e3dec488b242fc693ec4e26a95a74fdd85bdc5213e131ec990640891d995115063917666c8d4910ad5a252fe40a7a88c878c938b817111e124575dd97bb832968944d4fd952bfe16df5be9768ece28ca593d2f58e8d7a42d4c9c5cd3a52a9ff00194ae6966fa993bc67779328bfbae425628d5cff00437f03da4324487bff001bfdbb7f844b6d22033ff14bd324ae6be3de92e171191d748fab3eb4faab9d64c90c440a621171936562485124bb5b6552469b4fd58cf49282a3a89de159ec88b24ec47668d4c7bb13b3a51b38ccd6779d7fc37d7222becdebab4e86daa8de128ffc7a7ff2853baa54d29d4a76974921415e314868b0bb146ae6bf476e4c6327c3f8dfed5b4864197da4c8325b43d319fc8d3290f77d873306f75528a5a4ee4e8dddf6440a62e1289529dc74ec625c953660c8506ca72c2384a674222edb2627b456fa98efa2b750d5c3feb5ff00af7d6fe2bf1deb4de54bd95ff09afb5fe10f51f75bf22263b5bb2453fb5a7fa8632432a7adff008b8de5b4864576d9a112194fd3db5bea9aedb363ee444495b64ae52781d4916de9101706589d31d331312316462c8a65865f74c4c5bea112db4d9220ea1aba4e6ebff5efae21f8efa85f7d2f6caff8cef87ddd3a39918d5bd4a351b85269474f325a79b1e9aa1d1eca8b4749deceff000d795786448adda3bff16bb6d2e2c63f647f1db5bf8c7d6ccb16df1228b8f745229f3b0e06274d1808b997380b6ac89108142055d534e8d6ccd5c7186fae5f6c7d6f59bea52f7dcad2fb28fb8bbae6a36fd1af03da448d47adff008dfc1ed22fc6c63dec47d6daa8de1c522de08a29c48785ae68485b210b69a25159d3818f6ab0293c5eafbc37d7b6a307757df50bfe947d9aa57850f695945eff00ef3beccc79dfe3ad97063192351c3f8efc3665b6ff007642f6b86b258d37c2c5bc08a712085cdf0b705b2458b1610b665487dd1daac4ff006b7dd4f7d77e1123eb6af27d4a2feeb959fdb47d895b8dfb92959a64657d92ddd4e4dd8a92b94aa7c45c9eec63353c3f8ffeb5eb68fb47fbbaf7bb3f929f77e58a29a202422c35b46431f2b16122c25c10b79fe49dc895897ba9da96fad76a69dc8bed72e6a57df0f69b2b778d1fcb66ec291714ae39171d88b12b7092111909ef39586c7b42b09df85cbfc663195bdadf41fd7b323ec7c23f924310cd7aff00a4bc7612122991231140c094068511c7c2b65ba5b2d995bb4a9a22562d77aaed4f7d7ff5c48fa2c6abf3a4bee2abb463d9ca7b4fba85f6b88917ed1e4e1b5c52da4aeb665ca556dc2dc2dbdbcac7b32432b2dd1a2febde1e91616ffeae1fc87f63f0b10a3b220444c4cb9d53a845a66056567cd6cb75c7551294884cafea844d54b285cb97356d74d10fc6db6b17df47d9a8fc3fd93132e7fa4d344531bb914280c871921888cb6aab85ca53f94c96d59f7de92b44b8ca6fb1ec8f71163fd8f0d7d31f818c8a122664424464458a455d4282abfc84dba5af653a97212353b656171421705c2b2bbb58848a9de127853abfd3bebd7fce1ea9fe36db54de547d959b511774385c51b6f39df68c7921cacc711c76b8fb8f845dbccbc6c64b6a9ef78fae3ffa5eefb3f6bdefaafc25e06323b54bb14591b94e6ca4cec49264f4aa44b4f628f622cafdf75e7ac6a159a62ef0afeaa7f46facfc297e347f019ab877d3fb2afa8fe39c4ce25cbada4ae7448c2de09c6ef76b6b92f917e4c96d2f7b213b27c9886323ec5b6a17db2e762c488488c9155a110446911ec2d9138a90a9b426d161ad9085ba5b2dadcaa15e5768a1eaace9c56a674e5453da5248a9568b22e96343f02555449d5848a76cb22a6a222941c2c89cdda1f7471454b21331b14ab5f795449f15ef6687bca3f318c64dd94959ed4d64ec31ec843da1bc36422afa9f3b16248b1df648a6450c42dac58b162c34216cb9db831f7230c85a7b34b05ae1ff004c7d157d6a61db4cac69ff00acacae54a6ef48b9385ca14a54e337dadda97e3395893becca1bd57de93f0ce172d6de5c1eebe34897a7be9a379eccb8bb6d71115b2297b7bc8aaacf9c98f822908a9321223cac345b742e0b9dc853b0fb0bee7aad574e55aae7454ddba8cc24ca95a5074ab4a650a57a7d23a762a4e4538e43822a5334fe949d8a6fec6cb6cca27545593271b94d78ac380fb13e36d97c5632a7e2f7fe3fbd4e0843da25cf452f7bb352beee727c514d8e634d94e9d85e0b16dd6cb9bdd153d5346ae595597f4ada84cd57bd39a6feb193f745ed599a7f4a4e4e443faadf774fb6d4fdccff0053322358553c535dda1ae16e17f05fc6c656fc5eff00c7bb54e2b7b0b6a5c7591b31f1bf24459162485633429a658b78578ffc8b1ab9e954fce5fd4bd08d49a734bfd5b4ff002a432a1a4ef1a4db27ee8ff5e2535b5bed87b9128896c88a1785c6e74c9531a2fc9fb7f0a5b6a07be857fd3c2b6a7e96dedb35ab9bf041919172e5c856b10a8a4623f852f54e64593f553f37fd50f4f6ae698d27f51395955fca0364cd19458ff2a3fd6d10f437da3eea232664cc885364616f2d5816f90c7b6a3d6ffc7aecf77c96d4fd6dff00a66a95e2fc4b7b9162a875519993132152ce8d7245fe0beca50b91ba2bcbeda8ad297f541fdbb56f5a63493ff95ca9eabfe50da468fdd297691a7feb68a76b8c5f92f78125629f9e7f258f6d53edb2ee6825c1bdd6eb687ada5d8656fc5f8e522e289181898eca274c742e2ca991addba82917d9799c07d8abeab3bce5fd50fc76adeb4c695fda99d9957f280c7eb47f9d9d32f734ff00d6fdd3f6c68ffd3958cd99315419199714cb9917fd07b264b6d54afba3471edbbe5710bd6d3f5ec71b93567e06396c91116f18918eec941327944a7548c84c5f02bc715595a52fea87e3b5634c69bf0b8e456f7fe0fd693f39fa8fba3fd7229fb7ee4cff00d4c4490fbaa7324ac465b27bafd0c8915bdefa3fc36433fcdded117ada45211ab8da6fc12622db216c88b148ec5d1d8c513a48742c45084c5e7d4fe3a8fce5fd70fc36ac694a3f8dc4573fc3fcd3f69aa6ed08947f088bddae604bb4a4fbfa17725db6506d2a4626258b78d7c47b324489fbd91a55f66ef97fa85bb11feebe23e6cb0916d908c8cc5508cc5213109ed2463f0b53f856f6ff00ae9fe1b56f5a6297e3b573ff003b50fce537757287e34e3d98cba63a2545dd22d892ee41b894e597e89f16487ba34ff85f65bbe16224782db551ca0fc7612144712db24216c85b32dc2fe37b6a3f0a87fe297e1b5634c52f5b6a0ffc1228fe74964e5369d092231661188eb77a68a713148efb67133891aea2755b255e7123aa43d4c44efcd8ab7c7b0c631bb0f7447c7017147b2bc31978522c2422c62625b75b2f83919f6c8adf85417e14bf0dab1a629fa2e6a45f80ca7f9d0788e298e51255dde5f74ba5265a43bc0a72b2a9a993211ed5366fb0aac91d48b1d3fb68d5c4faa89d53a8758cd9d6b1d4ba498b9bf2df6bdc631957d6f4bf2e4c447b8d5b68fbe2b6d6d2ba7cd6cb74f6b0848b16f86c636644a7daa91fc68fe1b56f5a629ed6353e97e162dda3fd90ed36b25a5ec9c3bf65b549f7a6f22a7e32f54e76251bed894e8e43b5ff00dcda14f2230b099da462e2752e7a1566549bb6cb9ad9f958cd47686fa6fcd6cf832e229d4b0e1723ef75c24ae57a583f0dcb91d9085b5be0a10c648b0fd5521ea8fe022b1a529fab091a9f51fc36b7fd2a377a7f70ded61a512a53b91fb6553f154ddac2311c7b52fb56314744a9122864e56232b14e57553167788e4877f92c66a7d6fa45def616cb92da33bf35b6ae8e6bc37111d90842dac5bce8432434343f558a7ea8fe171154d2944f7b6a63f6c3f01c45044d14dd8c0b18925da955c9d48fdce1f6d3a961973324efb529dc88fb9325dcb2b74d1252445b94b3b11c6654fb3e4bdb51ebfcdb4287e3a7ed3dadc3d6faca18bf0a23b26222c4f8dbca85b319627eab948a3f85848a8bb698a225b4a9b98b4ea2b2dd43b24916dd9a787fd22b6ac8a9ea6465da33ed0643dfa2321bbecc91719280bb14dfc86319a8e1a1f243dec9ed8ef7da51c957a2e9bf0210b65213d932e5cbf9d0c6c65c7eb505234aaf4f12c5434e69e3df032486db2c61723450d7792ecb8320b14bb26cadea6fb32c28f68763b1fe40a9d8cd90fb94fb6f91f91f8fc963355ba347e978e9f2521ccca25e02c5956942a2af42549f24477bec989899714b6bf916ec63dbfcd52b144d1ff5a45895094c8e9e1132b16b96306ce9ef624c4f93f456f4d76947b49087b22c57531554942b594eba994bbc76bf7bfc996da97c34abfe7e15b53e487ef6b0a572a5255235e8ba4f8a170b991190a42622ff0005a312c58d6228b3410ff96163a890e4e42818d8501479c767b5f86ade31fa823a93a919962c53b4b7b9528a9894a997bb5525114918937d977f92c66a3f2df4cfedf0ada972b8f835732712718d58d5860f85c4642917dae2626290a4265fceb7714c74912d0ddc74d180e6d1ec502c60c8c52f0210b662e1aa578ce9b4469ba84b4f38463368eab154442aa9171172d72a50b1d3438a233c5c9e443e4b19a8fcf681a78da3e05bd2e4b9ca91ae8f77c53dadb5f6b8989912e22ff09f1b0b65e15bb16e8d4fe1d429b71324e2f4c8e8491d190d3894ea5ccd0ac2daad2cb66fbc62ed084a3f258cd4fe7bc5597816f4bcdae8de0f9213dec62280a02896f8371792e5cb972fca44786a7fae94132e4a439e22d433a849292fc4b94e592de70b98a442a40eac7e4318c977de1f97856f4fd796b2ca32e485c509885e45c64466292dae5fe1312dd15ffaed620ddb34f6a71c4ab0891af6755088cac426a49bb88c892c89454894650f92c9fab6f4a39497923ebcd5559f24c4f74210b6bfc091feca2a64dd4a62d64c8eb48eb202ad065cb97f836274f24f46cfa79c474243a2d0df69b2341cc9d523dc92ef47b35ba270bfc9632a7a7eb6a3f92f247d79b571b4fc085b2d91612f1ae32d933d95b48d1d468eb1d48b2331579a16b24475c88eaa9b14d3e37f2db674e2c7a4a6cfa544bf8e63d15544a8cd119624677242772e2271bfc8632b3edbe9911f1a17af37f20bbf81088ada2848b7c19ef72e54a71a857a11a67529941d2a84e8388aab3ac751098aac90b5734475e2d64055a32132fe5b162c587b5874624b4d167d28a858e9b2cd7c8648afe96fa5f4bc6bcad92a8a055fe4921d5753924242428891146225f0e6f85cb8e46aa8220dc654ab6456a190e2d6ea47559d63aa8c90a6d11d54d11d78b5d023a88313f2d8b162db58c4c4b7c67b3245723be97d78d78dbb1535f044f5d364ea5f68f242108b084b83f82f8b2a925de899128c66746e59f2b9d462ac75519a1485a8a885ae90bf904475b4d91a919791975f2d8cd470d37e3e38fbf032b7f21189535129971bd90b921322223f0d6d27b3e0d939d89cc640cbb2a9891823a83a4fc573a8ceab1553a88c911ab242d6d442fe46447f9142d6d362a917cdc518fc863d99a8e143b47c74fdf2a95a34cabfc932a56954e2b65cd11111f8b2d9ef72522a4c72b97131c852c8c86af1a352c4b064f4ee3e5b99b3aaceb1d64668b8aac911d65442fe4a447f934475d4d8ab41f92fe7632456f7bd2fc7c74bdf0a95634cadfc936395f92f1c48329ae0fe05f949952a139df7b97cb6ff00232b0a76717754a762f0ac4f4f28fc1b9d467599d615542922e29b447575111fe42488ff00251f90c915bdec9d88faf1d1f7b54ad1815bf9164a6e5e05e34459065cbed6f80f67bca455aa4e77e1ec4451299719a59d8ad0b3eae453d4c917a750a9a7947e2e47559d662ae7557c89122afbb6ebd78f4e55af1a656d7c9929dfe258488a225f8bf852915ab129df87b1102f6dd94e5dea7a65c8cb2235a74c8aa7a82a50943f5f224ae5424fb79653511eb243978d7911110b77f0e52b15ab9295f87bde049f1a53ed343212b3a72532745c0a5ab43a50aa54d3ca3fad913f52f658b78a52489ea0c86fc8bc884217c594ac57d417beedec84365fb71a6c931ed1a8d14b52ced32717174756c9518542a69a51fd53243765bc63e072489ea072bf997990b6bfc39cec6a3537e0d9ef643ec21be516363de9b293ed2ee4a994aaf4852b92c644f4a356fd4542b4ad1dae759d58f29d7252bfc05e65b2e6bc956ba815b52e7c1bd96cbb126447c9718147d122a146b60ed9252b1251a854a2e1fa791a8f5bd176170954512a55cbe147e02f02f0ca762b6b094dcb85f7b9143f352891ec643997b9f4ca42854a04751099d3685327a7b8ff004b2353c28709d61cbe1c7e15cbf042e772ad6512aea1cb8df8210fcb1296d29991911aa529dd56a1674350e029c667a254e350ab45c3f44f691a9e143ded56adfe2c7e22dd0b93915b5762751cb8df8ad9f9510629121b2e2284cf6aa46c5c85698b50539a91574dfa2648d470876195ea7cf42f12d972b956ba815752e5e35f0108b9290ded0894fb119158645d8a6f2274594b5255a0aa13838fe8192351ef7822a4f14dfc78f8578d0b8ceaa8953583937f323b5c6f644445ca921f72102229d89b442780aac6a15b4ee1f3d922b7e5bd2f75a793f8f17e15e15b216d7275e3127ac6c949bf9a843637b2231122e4a67790a36dee39166460c571d153251b7cc7b48abf96ea568fc98bf0217816c999d89ea89576c6ff00417e1123b4b65321dd6238b188811d9c2fb54a16f96c64cabc1fca42917f232e5ccec3ac3acc6eff00a84cb927b24642aa754f628a2ecb990aa323a8132ad0521ab7c9632655f7b21fccb972e5cb899919199d43a8750ccc8b97fd52db2dee396d042ddb333bb176154b0aa0f1a855a4e9bf8ec648a9eff4b72e5ff657d9172fb42025bca65c4214454cc198b20ba90a94f07f198c992ffe72fbc5105b5ec4ea999911bb2243652132c5587517c29cadc18cacfb7ff3c88a23d86ec4ea5f78c48a2222e5c4459635143e14ff0037c195ff000ffe7a284872273beea22422e5cb898a6750c8523fffda0008010321013f01dc994eafb91910a96233be4d5c9d2b741a25b6e5f2b972e291a9fb9ad9acd6cd6cd6cd6c55188917b1acd66b359a8d46a351a8b972e5fd4a653ab6213232f6642adfae73a57e84a3f0387c0d22c8e070381689689688a3114626888a113444f0e278711c2268469594848d28d28d08d069469349a4d258b16f5772152c53ab7148854b09df2942e4e161c0f0d9a0d0686686786cf0d9e131536786cf0d9e1b3c36786cf0d9a19a190e83cec59966692ccb16cacfd7213b10adee4664276ee4677c9ab93a5618d9a8d46b35b3c46788c5559e2fc0aafc0aafc1e2fc1e29e2fc1e29e29195f3b9a8b972e5cb97ff000572156c42646642a5fae56274bd86be32e05d1746a42923544d7114a25e25e25e25e25e25e226bb64fd75f9d09d8854b90a9ee42a09dcb13a57271b1a4d068341e1a3c23c242a4bdcf08f0be4f097b9e12f73c2f93c3f9231b652f5971be6df38bb14ea5c854b10a84277ca50b93a56cac58b166696696599666966965996624f2997f5721be72c9112227629d52153df268a942dd0b67c4e3ec71f638fb1c7d8fd17f83f47e869fb65532a795b2b727f795f2b97cef95cb971bc953e7a23d88e57235085514ae3250121085bf5d875bd95c93ea54e99405b2c58d269349a4d269341a0d068341a0d26934962db29c6e5b9e88f6167129af9170351a87c4484291a8d4bdcd4bdcd4bdcd4bdcd77e08d0bbbb8ac623ccc91621cdbe772e5cb972fb19623c073b73d10eab6d2e7dcb163496e4d8b162c58b162c69349a4d269349a4b161171f3d14faadb1642572e257349a0d3f0697ec697ec697ec69f82df07eb92ff00c4a28f5dca46a7ee6023aaf72542fd38124e1c0d5f26a350a46a3517f83f470f62cbd87043ced93df7cefeb9147af23f8ce09fd962a5252edc495169be069b091285ac585b2e4ea5f65f9972e5cd46a350a46a3509e561f0359acd7ce4228723011fc17ffa164e3f04a8dc5864870b93a469b67d094afb24fd2a1212272b0e5e85112872300f8242dda4ab4f870348dd894af9c617271b13ebcd7bec448a272b0ddfd122250e4517a230b7723d16f7c4ad250fb24efc73846e2562b13ebe910e07896252b97d97e72114391868de9c6e85beb5750f964ea6a7779a44588aa54f469114376272be48b6562df3b2fcb450efbd185f247eb7d7c468e0b89296abb6f24ae53c3df8b270e1d093b11a8395cac265cb972e5cbecb972f95cb9a8d46b1d7f61d46fb9a8d46a35bf7351abe4d5f3b564b7a114327b5186f247eb757c4db821bbe4a3728d0b71794a372ad33a0a572b8b65f65cb972e5c7b18df396db6d89437a30fe48fd0b3b95f13d52ce31b94695bae77271d4622969212e362b9a84cbed7b2e5cbe74e1aba95287b31ab6dbf3afb6251e9bd187f2afacdbb15f117e0b372b773fe569e83c74ca58f6baf11ff0022fb10c76a5c7810c64787114e352fdcab4b44fa702b7134334fca2cbdce1ef939dbb1e21acd46adf095bf653fb2b53d4342573c3f93c31ab6cd1b2fcb846e52565bd143cb1fa10e56e2caf5f57044a561d61d56395f6df2a755c38dc78d4d24fa95a57e8cbfc97ca0f8a2a4b4bb138f7e6291191523c44ad9cd1a4d225e8294ac437c7aa297957d129e9e2cad59cfe89cec4aa5f9b6ce3d8c43fcbf4884c9c7bec4b90a4377dabd140a5d37c3aa3c4d115f44ea6a2a55b1295fd0c0aeef2ff59467d8b6c7ebe990e8b7d285edf0395fab1bb1395dbde90a0786692dbe9752b799e7f63f5b7db4ca7d16ea74b5095ba65567db6a42a64698a0281a074c74874870b16d89d894af922af6357f82a653e8b6d285c4ad969b953abd9185c8c051122d9db2689409446b63c9157b6518dc71b7af45321d16dc3e5085caabc3449ddbce31b890b25c86ae388d0f27922af6ca97714bb31af4d713e45323d16c450625ddf030f5f54acbb1fc855bbd2b3488a10b25b9e7244d6d455ed951ee3ee2635e990b722976176db46aa8fc95710e7f08c0756cc44b549e714216485ca9c47b1157b654bb8c5d897b0d7a3792de8c3f55c8c174993eaf2421084b917d8ca8b622af6ca977191ea8a9d4bfa95931185ebc8c34b4c643ef9210842dcd972e5f64d5c79a2b76ca977ca1d515bcc43b9dbd35f259a309d7914a9de931e685215414c522f9b65ce395cb972f94d0f25d8addb2a5df2875456f314fbfd7a65bf09d77a30cbff195559bc916140f0c51b11167a4d258b1a76d45b2bf6ca8f7ca1d515ba94bbfd65a8bfa659c4c2ef46197e08c6d1d3c7df28a2222c359476dcb8f2b66c63cabff005ca8f7ca3d5157a94d751e572fe95671309bd1875f8c7e8c742f0fac9098a56ee78abdcd77190cad9324393f7235189dcb0f3a83115ffae547b8c8f5454ea53ee3595b24fd1acd88c274df1ea8a5d23f456578b5f05b8ecb09654f634693c23c3b6562c35954153723c268affd72a3dc647aa2a75653eff5b6de8d66c89855f8ef875453e88a8f833bb2c289a4b0f2a4b96c635712b0a9292f9313db2a1d58fb91ea8a9d4a7dfeb917e45f2bee5b2261fcab7d2eabec8742bcad16c4245b6223c97937b30eee8c5afcb2c3f564bb91ea8add4a7dfeb9129588cef94e76351195f96b640a3e55be8f9911e8627c8c447379210c57ca2efb1ed5d8d2519698b315d56587ebfa25d591ea8abd4a5d5fd16eb9b12ce51b92562353dc9aef927614f94b640a7d16fc37990ba155707f592cd911b21218d5fbd882f7e22431f220ae8a8ec9988feb961fcc4d717f647aa2b7528f51f579e96c4b3916b92858bf356571b2971688f45bf09e7594bbfd0c88b26295b2865722cb971e77d8884acac4a3adfd95a95acaf7b10a57691ff1d45be2f80d716430b1924efc4953e24a8a5d1927c5971c8c3475295fb2c94f8db6c95bb73191ca4f2c3f55c8c2f996753837f64459379a4280d6573517debb0bb1397156314f4dbe4f199465aaf7f62751ddfd946a376e2621da5d4a4ee54f3318d181e92fa2a4ecd89f7154db5236dd7dcb3b187eab91825f9648c546d27f24445cbe491065ae68250b0f25bd76242f3231ddb2c32ebf455f33fb287fd98bf3230e55f34bec63303dfe8ade679463f1b5a1c0b7296cc2afc972301e618bafe8c72e298b645654e2245b2a94fd871b7226ec88d66bb94a5769fc98eec230ddfe8acbf27f661cc6ae28c3957ccfec68d36305d5fd15d7e4f2f10d66a2fb1ae6a306bf2e4603abca5c15fd8c5abc6fec2cd648a65c93cb517b8d6fab950edf663ba2cb0bff004578fe4feca2ac633aa287fd13eaf26fa183f33fa311e6792349a08ab7a2c0ae46023d5e52e8d128de2d6c5921335335b2e3e4d5ca876fb31dd16585ebfa2bf99fd948c67630e548da4f2b14e5a5fb1561a9dee323235a356cb9af92b62305d391fc72e0f267b98886997d88592173593e258a0637cab2c37fd15fccca6633fa986ea56f33141b23412ebc47044c7b148b973572ef9a307e5de9980e0b264b85995e9eb5f2ba66846a13cae5cbf21931944c67956586ebfa2bf9994df1315c749420d712aae2cf1122552e4992e4db9a8c1f9572300bf02cd17b75e03e3dc5ec62687f65fbcae5cb91dd7dcca9952317e559611f1fd15d5e4c852670fecee54c42ec894afb263d97dadf216c89855682e46017e195ae7849b1e1d7bbff0064a97ff4ec55c3db8ae39a622e5f97511629f06625de288d272ec468e9eaedf44a718f42588f61cafd5ee9f4793f491282fc57d72304bf043cac318e2568696f34f9af25114fdd6a3fe47b2b13aad8cb6f97465871e7adb4faa29f45bd1848da11fad8f2d263e16b3f7c90b3b725efb162c69349a4b652e8c44b27b2e6ae42db4171447a2df1ea8a1e58fd66c68b1631f0bc2fecf24216cb16dcf3a724f835fb1e193e84b0a3a0c74daec5b7d8d0380e91e131d37ec5be0b656e42db855792e453ea8a4bf18fd6cb162e97576319898b8b8a77be684848b162dc9b1635c974654ad53dcc363bfacffd8a2a5669f51d15ec4b0df03c392a0c74daec5b92e299e1a3c2e42db835f92e451e325f645705b275230eaec56fe4adc21feca98994fabd9123cfb15e7a49143193a7df87b186fe414f83fc4bdcd2380e90e912a1f04b0e3a03a4cd0fdb75f2592e4e05715c8c2abce3f625955c4469f5656fe45bf2f0275a52eaef92d888b173aa54d089cb55d8d67471d3a76e37450fe4233e0de96277cac5868d3f03a68748744743e0740744749a343c97291815c8c0ff00ec895b151a6b8b2bff0026e5c23c095472e2ddf359acd11e6d4aba7ec9cf575c996122458a38d9d3b71ba2863e353bd99d7265b2b162c34691c0f0f991300b910969e29d8949cbabbed8e4c595842e655ada494afc6fba4889289d0a18e9d3ef7451fe4213b5dd99aafdf3b162c58b726e5f641182f2f3a193c966b9572ad7ec86efbd8965573a58b9c3bf030d8e8d4b5dd9edb162c5b92b3a460fc8b6db930d8b62e44a7a7a952b6af8d8c5b6d94d8916caed7430bfc938d94f8fc94eac66ae9df9eb3a46157e0b25925caa7b16cbe4b65ec54af6e84a77ebb92dcc64565223c49228d79537c1986c62ab6ecfd0d3282b457d64b99176d8b72cae4eba5f24eb39656d8cb6f90916b1265ae2e03792938f14cc2ff23d14ff00d91a8a5c53bf39147a947a2c973632cd6db8eaa44b11ec39b7df3b6db7298d0865b650c54a95b8dd187c5aabdecf9b128f5297443173b51ac533c43c51d53c4357a5658b0a24de76ca151c5a69983c6789c1be2b9518eae0b289865c57d8b87f8eb1263234c71b1279d3a8e0d35d8a58c8b4aed7270dd5fd31f562307e64217f8ea85359498f6fffda0008010212013f01dec6871b1aaca95f89456cacd7e8e8a1a1c729f3596596597bacb2cb2ff47434388d61484c4cb2cb2cb2cb2f165e2cb2cbfd750d0d0d654b75145145145147494515e55e2cbf05943438e62ff635cf4343595216db2cb2cb2cb2cb2ff40bc268711ac2627fac425e1b1a1c72a5c9795865f8b59a12f16868711aac27c9d38587b2cb2f16596751d5f459d4751d45fd17f45965ec586cbf01ec7865142d95b68bc472f75f86b0fc17b65e3514514515fa47b5a1e6cb2cbd97fb47b9c4a357e0be2b2cbdb78bfd43e0d6e54bc548ad96597e1be0d5efc89790d6c45786f83578d2cb7e358f08af11f04fbbe1484b2de178c98d0bc57c13eef8284b63c2f1d78cf0b74bbbde96cbcd1444a28a28acd668a28e928e93a4e93a0503a4a28e93a4e93a4af01e16e97bdc966c79598eda28a28e93a4a28add5e43cadac97bdb596f726320515b68acd14562cb1c852cd62bc463c2dac97bd89668fc67e31e99f8cfc674fd1d8bb440bc7fccad965965ec892232a13b252a3f21f97e88bbf9d9f939df031f7794b1d27495bdc6cfc64225628911f9172276389d543779d37f059637dfc07c0c7ef09090a3ca9e65ecd3ec572ded59bf01e56d78a12b12f06443b62bf48f8252acae0b3a8be0910ed9457e89ef94a8788adb6390e6759d4751d62d416a09ee4b30f78afd0bdd279b16c721c8bdf6290a427b990f78bfd0bc2d93c3911562cb637c698989e56191c4b0fcf7b593c3d3a469acb63cbe24c8bdd1c4c587e73dd28590d3a357d11cbe78b16d8e27ebf42f0b76afa1618f0f95107b191c4bd08647ce785bb53e5e58c7c345159445d6c64712f586447e6bc2dac93f9d8ca3a4e92b6245628a28acc764712cc497af35e16e9f716cea3ac6ec7b2cbc597b61b21ef12f5864497acd792c9616e9776425786c7b5edad97942cc3de27eb3127eb65790c9704bd90ef8651d2747d1450f62c288e086b0b31cc3de25eb0c88c58b2c7e3b2585b58fd9fd6c458de25b132cfc875de6c4f101ce853b21ef13c32231165e132df8cc7bd8f65965e5f1a109d0dd966962621911f98c7bdfbd8f73e2a16c668f6c4fb0864478b2cb2f327427786e8eb14af9d8f7cbde58f2b0f0b35b56c6592345627d85e86449f62f0c6ca6fb0b1435429134589d0a7ccf827963cac50d61325b96d6415b469fbc6a7613191267e3146b12d36c846b2f0e258fc07c13d8f28ac3e6645d1190e547e4bffa263d5fa14853bee2599bed8eadb2435e04b835363cadf4571457720244a35428762704410d0bd6757e0fc8464295ed921f3cb8353287959acae342f669fbc4fd7fa47b22640910ec858d7ed98c773859285734b8357311f05158be047415dcd3f789faff00483f844c83ee4883f858ea357b08e92cbdce3cac9706afacae2be28625ec87bc4fff00a465490dd91f63ec69f6ccfb11c228a12f0a5c1abeb2b6df3c31322fb8a66a76176c21f6227f44e556697f22ed32235f641d1d45edbe69616db353645f868eb24ecfec44fb223d9623ec7d887644e744a3d5ec9e877a7f269dc3ff0037dc5869a23a9629d0a7659d5cf2e09ec4f8ab8108a18959d24bb115d8a20bb927e8fc8d33b9d26bcdfaf44576bef9bf428d1234fe3b9658f9592e0d4efb53f050b0c87b28d45f043b21cc7f4283f6746543e59586e8bb1b2f16465ccc9704fbecac5e5f2a1674d7cb1b4873bf424d8b4c486493bfadb43814514277686848be563e09f7df1cbe7b2bfaf83a3fb6242dcf339d5fc9a33ea2878a22bfbe77c32eef7c7c7b2cb2f0f3ab0b21f0466c7f396c8ca9fc8f53eb965c0c7bd780b0e2fd32e48ebfa3f2214bef82870b1e91f88e93a7e8e9fa35615f225635cb2e07be851cb1be6b22c828bf46a7f16fe521e97fc3a2bd9f28ebfa16a1d68bfbdb4562870bee7e248fc5c8c9f04bdeda1699d86f2c7e068c6c46a68a97a35343a7b7ce68e93a3ec568536bd1f97e85a88eafbf0993e09f6794ac502b0f6be7d2d3ea20a84cbc4f41489ff1dafb2b7749d253fecea67e4fa3f20b5117c8c9f06a76146c502b2f731f2e9e9757f84635db0b0d91789e8a913d071fbe3e93a79193c2dcd1db6cb731f269e8f577146b74592232a3b93d04c9e835f7bafc064b9a5e169e87b6255bd0de34b33d152f46aff1dc7c4912e544f63e4869b910d151ff007621b2f769aa1b2f1dcd5fe35fcaf825071efe148972a35363e2ab34f42fb918d6e6f7211265889089e9a97a35345c7c163f7c2f6c95ec63df5f44741bfa23a6a38bd88bd97988e54772284c7f2258ab357f8ded0d57ae790fdee586f7ca397b685a6d91fe3ff628a5ebc242188bc2c4f4948d4d1e9e690c5b9be168e83f19f8cfc42d21699d3ccf7a132c73208ac5e251bee6be8f4f6edc57864b721bf06cbd97b6f82f65964559125a947559042c4a364f41a7c33f59965fea561e34c9bac405b7ffda0008010103063f02ff00ec1a5fb333a67b19ff00f2565f2d4287d2ff00d8297112fd9d9fcbd2b0609e7e649a9a9a9a9a9a9a9ade5bd44d4d4d4d4d4d4d4d4d6f29a9a9a9a9a9a9a9a9a9a9a9a9ec27f2a3bf604d2291c1c7653a26a6a6a6b794e89a9a9d33b51d4ddc6f85788d40176b4a5649758715e00ec53da8a805241d48ca91c547809559517a8d9ce3c0c9494ab4e870828b4f2a614d4d4c2029069167de5460360f6b747afca132b796f29a9d1cbc972520a41480528deb73d56efaa91522a0f41facf5cfc94cf929fa2def45bce5be16f85be16fb2a63cd6f0f3530a614c6d626377350f0b2af3b10e10f9c66a656f15bc56f15bcb794e8e4a6e527a96c9c1a1fb62e4f1e5fb0f385cb5b0afe20af1b595125252fd8c7d770509abcd132a656f2def4530b92e4b92e4a4a4b756eadd5bab74add2b74a9152f9523c23d615dc38b90520b742dd5252525fed78227d10d791e614d4d4d4d4d4f612b385519a7f27d6c2b0da3cac2b609c2c2b949f9c56aaff008db65e2f591ad19510ab04f8414949485930ac17d5c43cd68c93ac66335aec4b9852236a50b2c11309f8d6d5e7adc3629e6b3da97ba728d8cd45ccb1009a67b05ff1341c7f228e8cc5d2dab59fc86e3521bd5ded792140b1b49ad32d14f3fe45e9ef71bd4f22b1da34793ed1673e15c27ed5ded4e8140cd77362b189a5c518b938a7d38d6d407a8fd9384ad106e29f7f06e15de6758e762f865a33f853eab8d0f35f133b4efe21c1635ce762e97a91cea41629e6b9c90369bb81c2b386c4e762e73719a70156325fa0c8dca12beb1bcc3cd00f535353f9030ad85fb222cac14c04e2d0f34ed60b782de0b796f29a7b460cc96f29a9a9fc8b82704f35c50d7e72e0e75a744d4d4d4d4d4d4d4d4d4e97d33f92b151acf324ed88a3cbe73c6bbdaf2daf667e72709d7799ed3bd19b23829a9f10ef919ccf9d67058ed5ace867a689559a9d12b01c27f23384bdeb382c51c36a479d0c74fdf8d91522a4b927c2985587c8af2b0ad8512501e6b59c1cf729517ae7b06b2a34797df652525252a7fd291a792985bde8a657fb5bab742956211ca98d18270a5df213cac2b3f92182344d60c8a3da87ad58b85cb9ac68ce1950f0a324e8f9265c0c149494a9de516d422bfd2914034f6415fed6eadd1e555db77f2355d43d3cd110b74792904cb8013d8083ed58a79dae1562afa5de4822392d17ebd2107cd6efe152524fd1c47c07ecb1e6398a7c5ff64d6b3310e73d35d4680b51aec7edc33aabe80fe5599ef5c042cf02ade53cf11e12a31ff4b46f1b8d3fcca8178e7f132e5de34be4d5e269da4ecd72341c936706135d55355a9f237ffbe19c5617d2e50aefba9915252524cc39d8036e176a8e1bdedc6805d0f38e49ef312a3bad7da98af0459f87fa4d3ae30e6be96534cf32dc138871470a755a9fbd7bc1e020a49e761aa3ba8c542c93b7d56677dd607e4d0f10c45cbf1f4ebb306873fed10d39e03325adf0e917e3c269f23235354ef7bd7efc53aac6362e7b23401cb9ac9398f3e2467b13cd389d6b9789c31422f29bc935f47b2d24621a5f0b57ad56dc0fa15e195d493cc6aa71deaeee324a5630d93a97332f7b0bdd629ca70e4af1ee9ae4f64a1931f75a5ea4e211ff00265de4b55af133ea16b329d24d8cbd28fd5f248d91ca8748580e140a4748a2075605c4e08b0d4472c111939697aa88a7b304ef4588e5cd3dd30ea310b1f9206c8bec9fb28401bfdd074b93f25a4718eb7629c606e51a446660531ad3c3040858a789ac79fc9fed446c7f7a5c9f345f87b28af887a8fed5ea0b11aaef35a3fa9468c53c27fc8a362c81bcf7a79b34873debf3950f103f934e6a07d0afa47a15a2cda58a8d2f09e3e44169df50bb9ba2670feca61ce78981cdfc90144518bc33071c4ad1666a9ca878f90c6d9e6c49d6e5144c881319ff00483c4aef7a1afa568b335414f0bdd3c7c8436b09a9f3b01fb1c282032ffce68099c229e0f628891d5710735a1ccd567bd3f64f1f20f6ae2a382c6838580eaaea207353a5d8af0875e5466b498eaad0752fb53278f64ce6d505e9e114f1f201cb66e141b0e3b07dc50c9fe6b1125e2826b16415ff004fd4562a3117a7859bc2d1e7f6a8485873f901aed532ab8a70a5d613c6c4a8c430cbbea4f65d15cfbad2465cb025683aa978814e6a0419a63aa884d4514f5a33ca20a78b79ace97557a754f7b11f5e6a3241ef0cfaa0e85c11c405a0ea508e0ae347504c75542314462bea5fa6de3d5f6abdabb8823144d8b0a24b1a4fa19a003e3ccf2ed43f9fa22f9e1101683aa9bc266f06498eba8135814d837858261fba45badf53358d12b4355d2c68914ee4511f85683ad78877a730568fa855267adf629ad5e6b55a5d24a61f222dc3fa8ec4a75d41beca2ee543dfadeeaef55f7c97e04e01683ae884147cd32d63ee98fe4a2310a08fe4d4393fdd02e76b32b55a9ad23382d1e6d219bad71518cb64fa39826ca8d10e725ae2239dfde879ecf5fd2d075d4bb985a33fad9a5e26a3cca8f32d7ba0260a2d305ffa79ad5f898593653431656af95b4c0fc86d1d1b231a5d7275df8537d32eebe208347c43f209a93f01e8b43fc945eae4c9c5de699fe40a1051f3a0e07dd380916bdd68df2247aa6a322b47afbd784d877f914d0c3d8a694662d963a61dea77a86909dff6b2c50ef3fe9454f2727f2e5fdad07f20a62b54184fc9327f5b3492cc0a8f38792ee560a6e68891e698c93617629abe489e6163ced43518387b2ba808d5ccd37eaf197532347fbd98740cbca998cbfbc13af0b43fc814fcd46860f6f343f91950828f9d07a9fe68b997c4a8b3f70874a622f83e29a17b0990724de68d0f1699a5e98cb686e221f97d812d99c42eeaf41004404d43ff006da5a1fe415032ed6d697640feb669840a8dee50f89a571f30507f8613128a61de2c4260dec10502e8069366ff00ba9a9a789734f16b3230d9665158598452796b226505a2fe4153479afad9502a21d41749e0a25c0804cd03a831e698387b2d1ba0f114c9c915f4a3853aa7b5a469010d8f64287152ef651c2a968c3905a2fe415181cf591eb67de9840a0fbf550ea6bd94403e8992db3acfec426750eefc505a32bc93f2472a8196a76a3031f6433a8faa50c50a08e6eb0205461b12bbd114e1126402bdc394568ff9054d19fd48f533ef4468244a6a040899e29ef7e4864d7a15a2c933904c9bdc9bcab38cc5a6cf7f6596c4a66a1f4e35faa5c305114de367aa813abe6f3e89a87fe9a63f905467ac26fad9f7a8e3100eae314d45c434540bc611f429bff9197eade1325c586797340f65a16aff00e93430691c1e867ee8a14620ac6d21935b2690a83f1db192dd52e0b78f99470914f7a77becc2cd0f0eaacf46d7a263ac54d1f526f31ef509e929beaa0f979a619b8909967125323e03eeb5bf229ac50ab058da3f49d89a0547f34763ff009449c5bfe9c8850dbc1495c9cc07e2a2a31ad3ab92ed4693a1e3c931d6cd467ac2d2e63dea358103b26f3fb50d21d5f64c649aedb1946cd351b3733efb0146754f96ccde8e36040cd6f79a2d7e82133d6cd4d1ddacb4b9fdea35f494de63da9bfc7f64cf84bd17b0792dc3cd0f0a0f114f2320af53010169b6721b2155f66b9897ba8a1d62a33836cad2fe73a8df609beded4143abff00ca7dae33a8df50a9951da9348a5d654b9d567a99a807c4d05a6a8d74b29beded415f5fdad8151bcea1cf60293678c1a67dea0ea0b4d9214b58009afa7da82bea66bbb8175802a359d2768cb3decfeecfbd438b9d9ad3648654b5d211c99a7ea1b7366fd4577aa763d85940a35075335322169b2432a5ac191ea9ac99a0a39b34851aa2cf7d4ee6b1d88cacacaa3d3ff5b351ac9697a53390a7367d8a39334147e8f7af1b546558ec596bb7077e4a1e10bc548e0bb542866c54ee1693ba672149c043ba3d2cd0d1c11e966be1689a83215bb2348aa784970e311414c77f643e8a8d2d277f6099c8520dec91e4be967ef411785f4d13ab3b44d41dbd76e6cbca9675df2e4bff000f93426a656f34a2d349cd691afcec9b0c124b8cd313dd0a6545af441fa4960a061abf753f45beefa51d56b59d41e487382929519da06a0179aa7665d651c2a31926ba82151ae9298e914c90e9a5a7dc9df123d299caa05de92b0b2dacaa319d6ef6a1a819d50d4135e1d58853e4a6a68e08bfe129889dd0a668119a65ff0007de91d0d209ac90cab4a87d986a763c09b37ba6f30865439359afa4ad1f48a594cf4b5ef40c90c9b42e750325d94e939da7983c0e7c14b8734928669bcc2195257d2531952ca6726a9ee53340ca827b50fb9359da630dbba81649a5ac90cd37984ce5494324c654b39a67eaf6a5a4ca0850d50e46cf27b546ca1b61663e96735a44ce429299c93348cd3399f6a5a4ca0877a3314944532b2c6751a6794f6e0e341b2a148cd693b26721494ca67f39d23a93399f6a5b4105e754d471b2c542d5fc03e83c28e1c66b49d93390a4a650efef4f74cf5525649947bd051cebbacef4d91acea0f0b2e1bba0b4bd933d2292995dcfbd41d429ee9dccc50473287954ed5a3649a83bf039a06cb2866b4b904c748a4a65773507553f5284d04d666a4d3c9b4d9cb8238596505a5c82632a4a617d46a7d429ee162f45341fccd0f253af51ff00159d10144d4e88164a885153b70d94d6482d2e498ca929847a8d4398a7b8453caf0fa2b82e65d44544a25cf4edd1eab3ab35e20ec423ab188515ceb1b019cf84d6b2c2d274a672a4a6734d751a8d76a4f64fc5de688442ba9002f123821cd3b9524f250a91a908ac6892bb8b38d4676578b93d8f2e686c1c88b2826fa5339525339a6facd46b2a7cbdd4106aa453f90a1ac96155c9c13df51d4cd5e142c03921b38c4d7ca87898b2052df4a669299cd693acd2535d3502340a0a2cff008b334fbd10138f2585033a7ba39d033a22a053dcf0392fb512728478f6b86d6123641a1be9299a8ce6b49d74ca09c4a85314eaad9b977a4604506b0cf613e3daedc27b1a1c561639a1be9299a8335a5eb5157ed0e350d050d91a2ee305468e3c1c815baa45734e7a71ec6fb18a09ae94cd370512f2a01dc276ad0927396e972f0f2141b0b33c3413a4538a71b1dae84cf7f75150d99d8838d33af714e3dae4ff006e6a6a263463606adc7df888c45eaf088b12e5bfe8a5ac5380754bb82ef47862b58b9ca05ca6ae2a75229e22287d238fce3c4bc40a79e76c9a8fc6896f26986864a0af52aef13a7345ae2df78150714fbad9350f646fa4a01d4453ab628c14dd8274f8b348cf8b36eb549b9d4764f09c9f4bea62a33585fc5b46977186c2fbade2e5c8a8b2ae5bc38522f41cdcb045ce2f460a34bdee74938b341ad8f19de91c61b0dc629fa33f4d12a20d7aade52054415bca05fc24405ba9c090b7fcc2e4722a2c1f7f6ab0a1fe7c79e2d9cac5f104f734ebc456f35e49ce715e12ff007a905bc55ea2cab941ae1b742e6141a53b03bf12e0bc4d27303b94f31363bd9815728a789a71d840a9bf35167c8ae616f5a9df88878bd94216745785a070e7b4815bc548151654dd9a8340fc88e63c46fe4bc45fed68bdf15e286213c78861c041a216f3d6e85164ade766a0d0b20707e22ef75e00ec4af1126d28d0f102be1f65e21aa7e2e4af1c241a23bade7e6a2c83e8a2c91eaa6ecd41a1e7610e07c45c9cc431e69e6d8f0f76578397f8a76eb4af1c14eb40b96f79a8807d145923d78e1b789ecbc10c53c97db6f0bc53e45726fdd47c2d2bc616a3f80f11edcd43c23d7e417284be1fe943c2d730a50b486da2bc3e11ebf203aa38a7c7309cd4717284d5e2ce3b7843e48927faf35e38e3cd3fd42becc270a8c9e44ec616a4389fd3cc2785109ecc6ca35002e81af0f941c649e288cefb345b4e0a3c640a78885e2f09f4508a714f63cac7151d521f2abc28c42817d18ac2fb1454ed4b85a9051b1204fba8b1e50502fc0cd3d9f2b218a1df2db9423ee139af34f13bd46c666d4859715029cd0578b14e1694146cf9f65e183575806a1c6cf85a9f74e6e22f4f111fb0d15e14f10f9fa356155cd4ef51fd86927349dfb0f88e0c0bfe757b3c1335beaf9c3fffc4002b100002010303020505010101000000000000011110213141516120718191a1b1f03040c1d1e1f15060ffda0008010100013f21fa8c9c8ba20eb080ea2824410411517d5fc7aa51d724924d67a19855a1931524a256e2999113d0dcc83a22455d2899a0d1e834250950d44a20408911a8c2a1dc2689116a2a25524446afb8a90f7a34cb921b9afd7343526c5249a402974c84382efa888ea9269359ea9249e82686c6ccd54655284414927a1d5513aba25036273d6d4934915249eb9249249268b89a26a4d0c4fd8452620a48887a940834513d13d4a993eac4924d629045593a4df4730e69f45e9084a2e8f9122634a07a4c13262b86e362f3c21cad06fa234470121323599d0e648fc174904ea49c9921509310644a6a291324489121c144604c86f44e990cb12fb06344845d09c1b8273d4986611041047408208204411d37249a4d13244492492363a40c6c76ab5ababa4f0a24129022251a10a95805e2353928913a904208efd26ab2fd44e8b865c320466833606eb43775db168d45b6f5813852cbd0fec582090d81a8138269092f4c83d0faf9e844d5753a4f4326905ad5c6b2faf1d2fa27a11305e934489924d249124d49e9191318bc61b1b8fb5b04138e14546a241310e902351d0a44fe980099249248a89d5083440950c2b8c40843cbaeb14bc4204a940c66e8745879c6d9151896c97a615098f4872131991fe8d68711c428b3366632eec596b6247113263f0b9c4711c04b6244896c20c0d6c5bd4912d8d2215eb9a274b9c2424c90dc90d98b136e486ee86fdab2522a4d17d006f24b84882082288208110411f6765f4b9af42d1a8a904506410204a891e2788848923c274693363b88e6905d6ac668e7a8b08d06e84c6a32f414705f7a0b90952540bee3de066b2fb8c4bdc9225ef4531217f69a210e7aec7d840d536a042ac985d31746fa5349244c9249fb1cde15ce882555d7249249344933544924924baa491224488492a18624952e27d0268dd13a3a254711736ba961b5b7d9cc414542704991744182240ba892492492684249244c9249268ee58944a25162c4a2512880c3d9d5a283213558a8eb6c1d893c09886e2896ec96a600e864c486346e7189d42422e0581649132746e8b09448b688e80fd1d4094e2a31babd9d64eff692915244e906469ead0d54820823a422a410411f4608206881f40591d09085d292441242b9126ea9c7bbc17781228e096ecee7e64e43a47732dd58b90f98834925826c91dc4b735068225ee4bdc965cb971cb3b08c15a84f713b09235925b0df61a1f138472d0ec0defbb6abe052a4423a0d129787026b24924924d124924924fd36e8c6ccdd70542151743b0e6a43ca1a972f043fd191c7182d4b5d3448b45b931e01e073419447714bc9a0d1762f051102a2e842c89f5a90a8d89d249e80cb0c343d87bfdf120d45542704d9ab19049604c4bd72264924d084f5992eb9596bd7108228aa145190dc5225d202121b20b42529b5d890b045e0b5713771fe0d5e836a6482bba083d083d0653318129c43d884ec47623b1022d0d9f50d2506f9023d0e5b095687691470cfa13e90408110918e4912c40d74a0a1cfbf664a47450148921139e86a8daee2fb86a8d145abda9aa48aab422831a20812a20641148adb63c051b744104086c406921f51fbcef3b8ef3b8ee1b6e4d93dc70d46db8df926d4621be1e3fe0ae89d10444247d0d1293cf04589914489932448864886432e5fa556492474355c501148242351b2e65d8c09083918b427780ce17a8e06696e377caaec6b13ae4b0762e8494b7b1040c82081a1f1c64d842158924924b04b931c084248ac97df444172e30e88210c317072efba7d0eac4aa62649bc4d607221c0e2249175b28102242b4b8a94d183050b0c1940e8e42c4d462fa02f3d1c36dc91e4e71bddb1bc8df7ca94e71050a2fec6cd7e66a8240dd33a8cd784b1bc917f7a8c7772247f62edaad51cc87fb11a3f98b706aca548b0b5a04cd14dcab2a709a0f48356a8e41c971f3186ed2a06e69b512fb78ea7d07a40d513110091f4346a2a22acc993264a84f61312380e0380e038096c703380e064f624f41b6c6d2923dc68ee18d1226dcb60c2ef72e5c72908e25967897d68822a2bd093a2571ce88bd124d15649a26924924d249268926b346dee49ab74b0d59bede68fa1d71a308e46d1228084898e4dd104423508551482424915551085d2493d016b2da42d8586dd1ae343fb7b8d2f459dc370417610b82108e04cf41bf6b0c9b1cbf211b212238890a11a0c907a226d448bb906ef61af0168245aa8735fc28f7ce570773ccef0b7a2de65ccc7bc2d04a2dfe082ccc9358205ba209b55f01e8b5ec72a1ed0e05dc6b543e2627a088c26a87acdf751f43a3a1f52a936b8ee31e1908c9bdc43614854689917284220548a2e891323a2289cd96947dc6ebb0996c122631165ab16cd93d8812dee27121264105cb972e5f72e5c964b71b2d496e4f2140e76721ccc6db5148e73946ed7e87ebdcff448001f4556fb1c226d08c9f034d1248fef58c6322451609f52724f61087ba9448151814e8cd86345816d0a6281510d0a4521092210916d870427a1cdb65765b616ec8bcb2d84b585d847cc8b4d13349327a4fc499c813ce54d0f438886c658b543806a25d449b0d5f6d874e21133308b196245e5b7e8256f235dcbd0a635673ba4020d64fb9fc4a82559489596ac4d9a5841ae0673fa0d0ecbb52e47c791a9a39b537b27686bd062d9164577a0efec5b16523edc5f41d1fd2760d0b7e481b2081124c912243b8d094240b684fb2ac4070316cb1720b97c85befca993d64d18bd7516c5e90936484707cce1799a4f31113334e6a9656497e09d99112b06e867235512244c993264c98ba7924924b27e9a9a31134326a3a2c4861644f817e5ff00a6b9c78feb135b3beb45d104217fdedb76dfcbef58c63dbe8215b9d04bfdfb20812aa71a891fb8e41c8f4393e48f8d216f2f2111c7e53fcd6374588db51142e667f85f2024fe3f8147135f1c09123ee293e3a3084f25fb210db909476102ff0062727cc6ccbc448d5a9ca771dcfa885fed51d6f5e24b051eec7f8a137762e24d7cf1ff0048935acf23ee472385af4369193d202ffa7b1fc81eb967b80ff44b45a688426226ed3a3ec1fd67d42e9905bffb134924924924926924924b7391e67fa8cff60ff7045ce4e4e41f141f223997951258f2324e97e2b26d36e463d06b2ee8d024490b12c5e90a4a163ef9d31fa250a7b09c96c3ff00cac10410410411f7ce8df45028bc88985f1b0dc940e91f418c8912264c9932448820820823eb2ffa51ff00018fea4d756a6c0a71566b73b0d37de898ad508b5896de2198aee1fec5209742945c8ee25bd0ec1c0a89b2d06c2741d8760c30c2c0afd4e783046a32dd13ad2264ea45122190c823ec57d58ac7fc06333fa89711a5521d8f01a2135508271e2b4649b6e9206942174c84698102047638863c2069ea811fa42d22e6cb2faf9361c36e658de0ff008c8e4790c5f119ce3e067c0ce0f30d5a3c1c9f0b47c0d0d1fe0e47a1cbf4a57f987f907f9437dde4763f2af1204698f478096bcea486c4c9740823ef1f53a65f5eb28b9458f2a117a12816ac967aec5db773759338a344be18a8842ae0924924910adac90ee3a57efa9cc2f17a214c1ddeac76925b1d8760b81d8436e8e8f674b26493d292470886cbc8ff00011fe513fe8389ec7cad9f0b67cad8be91e42db36389d1e3653e3c970ac6e24f6f9e049abd0e71cdf23e30387f238ff0406dbb2a1115eaf10c1a850761d8436fb67d4c6319974d5155c926d3d29d980f247426917a1a2442bb565a6cc42024204b974d30f86202627f47411ee30bd930ba9cec9962d61c1191440a904107811440d114c884511f54001e912f92c891a1b7b9ea21ed8f6e48f0d2e3a473fe40e6a6f412d634fc9227510ea21ee94c25eee9a0dec14048d674ca2842e02651ac6bc0816ad89ecf41bff97de318c665d25d0f6125c371c223d7a57cc1ae5a4291481aa1c889d1430d69b92bcd75853c315174cc9e745abf9a9e50168ba9f7d8be6fb7e4b1084921a52e45f453eac44a4fd149249249249248777777e0c634ec47e88e4f70dc42fc8a781b0d24a5e44041db2dc4a3190fb658f4215d31d046146763b4ed5f78c63199be921d5c84035f84b5b6e842d8355b893edd5040ef9d082081a1d4b2f015151dc2d376c2fcb18492df56cadba86e2c5fa14f5a4b284924d24913ea92464c7d4c92493449351adb9c8336f6ee349a5a6dcf6e47d4539b5dbf54effa1ad5094b3e1f3b0d2a1a6497640d71490881797e478482aab66d77fa5efecd8c631993e9afa49291924242a3e88ea684a26d9e49de4089a5b2e65e5dc66d2eedf54fe97ec3834deabf362faf12c4a88e88e882290410410410dc584ac092e1e7e7a1a49226f1a11291f084ae4dbbee3d517538d4b91668ea4e15120d32ab4c7abd84f470489fde318c667d258fa69db9371f5208208a2906f91935a9ea33d3fa33d2949e862dbfa317bee11e945933f062facc4fa91d3041220d0741f374308c90c0c6a0e458e44e96a2351a88cd8817a0a94a6b42d04bc48d9f91e0ac2284bac22b1f59f4b18c6333e8c2890d754522c3406321299bf01afaee85849bced7a9ee9252d88d63f92a128d1dc464bb89798a2faacd982fb39664bec6d13e732fc5898225369f74350a49c35a8d20a7c47b823993c7088a2e3554adc4c0849e56db99ad46abe9a27eab18e8cba4c558ea8277c4dc44b73049fad191d2fe8c3531163a96912d8b376cbfc2ac215085a77127bb12208fa725ca522249249e812492493d020444925a393f4634723c7923868b9a342dce4884ad6659658b45f9209942f31290203417e2205bdc244481010aabed5d18c7464fa16c31563a1517325dd7227d76494bb243ec56f775428eef445bd9797ab1b9a410622a3893fad0644754742e88a4114b101ab6e56e097716ec12c25498e56a4345bca7ee5c872ddb9daf83756ac1085870344046c08771a04254dc138a474227ed1d18c7465d0b01f4c522abf468eb424b1dc742ea716b6a1315796adee26bc5d36b3b0b22704d7b21313fa924924924924924924a1324944095b92b725162c5b71b422941df4445de8d8b465f034527b14dc0f6c53810d4249445e0ff000334bd71bb09e7348a58909b470b77b917f4777e349b27d08228bebba318e87d181ad1744104556fa57d1432fc10c797e0ba9f7bb6fdfb0bc953a2fcb1aed92d98518da84d45b31e7b08677935ec15d18711de1529755102de398e439a9398e6398e6390e11cc8e21c7382714e29c11ed4e28f6b41bf18d44ef214b171bb8ec73178b189924922884fd0edf9126de44fcfa0375afb36318c743ea17441158309975a1f421472c218d3d247b05b88b5a125ea165092491a7b6605afdbd9d0926b2492492492678e94cc089123b912244891dc874a30e91381b41d57dcc0fe9ba318cc07d1121a8ba98a968f8a3076e944903a40a48577f41cf2dcb7d294915aedfb11d90c824af311545e57bba5eff8584c9ea1c48102046a1c94398e41ef0f710d77e80c3e24b69427b9de208924918d554475020822b041158fa724fd27563a317d1735dea8545d4d342fb5204a8488a320ddfa9ec37d2c68576c463bd3b2a91482723a4ea26ed610870ae9a4488e81cc731174492761d91b504771291d29104c91325d24d511040c78476a0a88754d20518c8ac52691d303544fe8ba318e8cdd19aee8cf9d10a887d0c595ee461c8f3542ae0d0fcb7e9d4e7825b10b2efac6ac1040d12d45988e49b813d864878fbb16d0889b625b2e409b1dc3bb44b6151125c8264899213d2a9aaa5d5a49a1a6084104090e6b0e0c9a98b7a904752fb09268a8b86ab156318e8cdd19885d2c5d0969919e99122524dbc6a7befd4690a77d4ccf02576d442bf8d6082e9e136344569bd07641dacc499bbc448a8b90c989c9574520948f5b88a30542e2c9ec26d844f63c8631fe426ff485c4f118e9b4086c6a886b5c8a1e8dc60b4f8865e2a2c32d10410244103913d10411f499143e9318c63a30e8494e81754526d1682151a1a2081cc1090fb15b6efdfa9f7c59e059cb30e759d86bd47f4571b3600a5e52f3182984abbc476ff4416bdbd7dbb8a25c6e69fc42b94b9624c2cdb32a23be8425a78766f8945ce71374b65a56b74de2df9d1278a23b0aa88c40d51325ee1ed68dc044676183584df885fad1dd9db53556970bb9ad878b20fd4c5abe8097f0fd312346fe3b091bbbb6cc2791224e8f24251d3ce8872e528ee25797249a37914901cfc3c3339d93520581091e23cb799ddb514a8ee23a0d1041040835a3eb823a1888eb83148899a4d4cc9d62174668ccba49589ac5164838db42eab32b26588c1468e3e6a39d9bbb7a63f42f189cb73f22364ddc477feb14da4eca57813bcdd5d2690311656f9d841355fd86c7b05cdbd5ead9632937c4c717991d8b62566ad6e45689b4f9b7f0561cca6726b2f61456b965a31a1719c934e148b6e2d252495b43575ab63e1113357cf51bd1f93375a2c8b2f7b5c7b084f6863b21a45c42761739bc1418c229b674ecbf2684df76fe091a3d5893fa4255849785609dd595dc8b6f387dfeb5a9fd085b170d8622b0c9f0a2e2127b26e1722108be8bf2f9216c5bd0d728c3792320ef045b60f424b6a4d1040909412d33c2bb6f6f01753e974108fa1234098f83147435ba3daaa15628a964aee6472fc8d422903255e05ab3ca02d152491871a323a13131f309c25a0912dd204f76a047c7fa49884e328862696def0356510a363fef98d94bf1afb0b6a576da58bd2f59a82ee4825844fc48d294be4703c89d5b9f93a18b94996ddc4214779c3ac252c3d7f211bd382f7925df091090c5c3364d0de1deefc7975cc8f39f596c6c318f0f1a3dfe6a49c5a9222f5a105a9598e7c4bf45dc4e6dcb15bbddfe3aaf4f0de3612e21040950e5a641de892a2e855667a9aae09e86a6988a1350eb079e84f4751566c6486908b882f9151098106ee17e592225d18d8fe8886af574681b739bfa8845e75422dcca0b8d3cb04d0da52b2acdb4a44772329ce871c647663b0b707989bf9166f30e9b10a72d6846bf2490172b16bfa1a2894d93eb6cc529db6c2fc0ac27abf930438643e07823a7fc887f1e79ebb0db5fad0206657d1fb0ed06ca75d07a93510c7faeb4b6d718ecdc41317625980f284ed62ff6a3528e94cbac9f5c104114474c75b17616dd04cf81155d06a8c49e212504912a5666f87f839a5b96f574954589a4f54084084a25620522c341a8e939d88fc647b2b0469b8886e7747832e6e9c9a52e1613d279b118ad65a25c3fdbfd6463bdf5d33442b4929e53c19bca7caeefc1af481b591c6a889b7ab9fc24bb4936a5bdc69791a08d49689f588157be314b7e48499c5fc67e67ada4e56ab81089a7f59a91cbdbc113cc7362d97d095bf2d4b451716f822544278bff0008688ec214b5d96e5bee9ecedfc1586e7a115557d31d5035d67d021876e8b87291155d074612465da4687ba16fe05fb275e8fe86e68d8c3756fe8230a771a0780eeb9160b8481ac7381ea8591509745c1ac3d33fa1b5fe2a30f6fe8ccaeacf6eedfb92050385653fcbb3f324ddc6984fd985749dc4ecd53b46e4412824e0e659a5cc8e37ca7fc2669cc6b87ecd7ce081de84938cfa315f285a93136b4bca10a9b6af26ff00bea810c895b35cee4b3f6ed48fd26691c6f4b713d10dbd4bd3e023216158f4ae88aaeb64114ba4d518ea63d16f7062a21657441e805b22d81ce477f084f23c2098dd6c35d785f9f4a31b187f41d22dd89a4c0910ac21042ddc9790c21bb96e83c8ea5b350c560d468bc469e5e22d41a4cd429b35ca666045129bb518dd3e64d0cb4e4dc35fbdec2b3029b7bebe07814bc98d3b9ec98d961065af5b130ba3c0d7b3447a65443f47f5e43de64fc66bb6e2643d244c4c74070844d6f39f410b8115f95bafcf55b0c3fbbf613fb86eca43d938848095a3a57d08aa3ae082082068b0818fab2fbe31aa2160265f7a1ab0aefb2e24409872f5bb78b17b635bc3fe2ae313f4e68c2715cd24924911248b96fec84e42e66c212899796d3b2df9f423057d05ed6bb2dfb89d5b62170430711765424d93f07ee6a29a49eb6d1ea3f89ed0f9dee28f8bb132bb1973ee1971dcf8ca25cabe1ac3f9fe9334ca3d597f0e2149a70d61fcf9a0bd84cafcaea7fe910ef479efff000df5911f420cd1030ee40d0fadfa54354311a9750f0234f3a97710b06f4142c1d37efd0df670455104885915c09477dc6cd8d57abd0d6690addb033873667015c9ee5de06ffc623d57c2e18c4b0347965b60866b69291f8f950d090fcc9b1e07b8bd4b6d0952d7bb6084d5bc81ad5705a2ca66ef9149ce83594e19666ca5cafcaff928748912aa1d63a11149a3a3104169cba2cec21ba3249342852ad97b988917527d761ed2fc168ba1a07f56041152253cc375a09d162a84a5761133b59b73afcd84c7b2dc5ca87364b895b6a28dbfa70a223646e789c36984b2cfdbc8ba0a7666d357cdc546214167c96fd1220e76bd9ea2d20484dd682ababefa89a5758ad97f2456b49b7c2c8390126d1d8cc4864212b564c3e69ff160487540ae451e2863155d5354f431d74aa4b4b762f418181b1b26f45abb8a94b98e4c9e9acc78cefd86d734be868fae04150af98184d0d1e4747318b239d2c2318ddd504f242df9cec53a10b34ee44b6ea2a7649625616bb8abec6e51a04b092b4fdad4ef7c6f8b9a0b19089c9571b80f627725b68d0894adc41304c869fc4c85b3aad53ff890318a8c8a4509103ac0ea9519045191d03db5f5aab6319342ddd88881a959e02f981eed92df519fa2951455788204da083a493626d04ede43d838fc7421d7c86bc8d062a5214fcc1b7772deac6270bc4984905949288824c74650945963bbf43c71bcd9eef9e2213b939d61f66bf2e58e09b0fd87f8227e59e34757556dc8431b886e88dca244775a35b0a3e22d53ff008e8810bc018e99188649de8fa5ee3186354b40d5f5342d0d50c59631b9ea7f4aaa754d4540974409c170861cf5816f4921e070b31978f2a69e078d44b7fb16424b4f821a72976d16ec8b167ca26a4a2f5c559445903e1f955721ca6f7f72f8b3d2625af098f33cbb722161253d07c7232611874ca40851989e5c22eec912a5e2b75f3024607e9c74c7dfb1e29361ec4c0c815e8c66a25342a323a1923e83feeab3df22c289428c4faa44214fc9b0b0df4d8488a84109744504108154062d1fa7fa49c7810e0feb4211139574bc068bc1e9d58d29dde36db816fc2b0a8ca49437b2f432057ed4d0e3e3563b0d1249e0f4ec14b06936699f9d0325caa8814ade59de0bd98d101ce9ac3c058759f4c9e1f78eaba23a1515fc0820688a31dc5ec4f911346c812a65559f13d8828343425116e973c2bb640496e953e1b8949f80a1f9646369dfae6ae209522a484aaa448410488a2189c706430e6452526d513f21ca367862ff0044420915d6ba0c09612f1646939856beedaae046f98dcc65bb7bcec9285dcbe2be8c2fdaf961a4c4dc1687af1ec24f2a86bbadc424b50aef35f41cd1a0d5c45b174f3bbfa21607ff0009e44e6dd848fc74b12a25d0c6c485613fa64d063a929cea93dac611c0d50c512c681f4685c12bb658b8be48c2bab2749dc93aa4a482095108484a840848484a21088a40e9d2558375dc71538164616bc936adc607f2c4bc91efea873cb791a0b77ccfb16086dce70bf63b4b659b4bf7f714918d0894db5eb9333bddfe64b0bd4deaa0f5d7ea2d8d756c9b6403c86d9656539dc4946fec0a96f0afa89b24a8ec2483d1b2a54ae05864a7d4beea04a5c9a924f42a6bd52342b7898f124561d186254cab33f64f72e7e0488c4c9496c6638558c2f17a214c1dd90a75df643423684fc512f8d3a926921285542a110409114421084e89d251c26ee8811e0648b9a3240cf0724440f35d63cde0820b2688d6af2f5201b8dc4a87e8a7cfb10367252d4f2f122e1fe23a02eb8dcaccd3f8192e02661e017f73ea1acaba32823c31b1c98d21adbbe1f95f91089aba78ff00818121a121523a22a916962228dc902116a65b3da3e68c1963afb17b97ce96218e70280e73f1220d681eef932c531e24908302320e38c2cfcf51eb036d44a76f1e47d295048410ba84211442aa132689132493523b928354edec45abb16d6d4486ac6a4c96be19bc6539b46215bfd1a11c5770d50b5ee472d9eeb3be626dd84ac7894223d8889ed4964b40b55c1ea55bf2fb0254220f8461cea8c45d888e516761f0b19715a44895a1891990685d9d9f90b54c94f0fa67eedb1aa604c98154ba3922c3b8579236208342dd8906fd1e25ceb3f61ec2d8f409682bbd7f2612dafdcc9d884c4f1998b7b88427622c882427923b7a8e958eeefb38ea4a1210aa84842e9151550842a4924d04210a43cb2e1f949aea35235f75ea84d05b771e446bc488f5d5c90474d61653b45fdb9216b964b385afc6411e5ae2ccf5b35486efc0bb1f61d216d9bec7a37b17d1443445a068bc3e310c712122cc2f2ca1ef0eed9e395f9139e87f70ae2548ae4434db11758425568ca04cd4f70d4518d5cf284ab41f0b733ad8f09b0b5f820953dcda9f2203e10c49dee5abb7fc12a6176fc9aa5e26a2166018434b9f9e235c39bfce3a52a21510842090909d0926884210a93d32216d441127c8350cb92bd1f11bcb9d4b31dde3b232484f66414984d4c3837a0d2a5a50e250d5afe8e3372f97f966226cbb6bd1c13c8590d80f3ddfbd159a341da79f03328cc59c32c3c119d1d1e643a06a37e649a4178f60986053e1effbf333d102fb7561315208f5e88106455ab4cdd1fb18ee6c3d29816b51e10e888b5218ff0022f7585f9a3835c8f2df61c768c74bb48cda51915ae341298679ae2572885aaf1d8696d3b63a504210842095081210558244212a220488108810aa46923984b6d77b0f7dbd869ec36ea66c672e76b5235869ed31f3ccb938b8f0b105496c5fd90fa0d253cfe8be49ea5ee49a20e18fd88b939a2e72b45de056e02561e9a9b4350e81af1ec6150673c707b9609106e37fc121db8d4524bd90f011a3353b35f8ea5f6a9510854635443b886857191262583cd5a7ec54d220b665d858ed622c606aa740eb1be373948cc6db0b9d05a9a9eb4186d702d5e048505d7ad13ee990ed39d064ad66894add6ddf6337d24210842090820909102ea4209102e925d170e0497a224ba771e07835cadcc95c6db7896b28caca34a57c4a350db6e6195f818967c4d9e4a7d468b856bdedfed5bd6d2f4258edb3f592021a6945fa0884bb2213c5ee87ea8196c3f6c9fb084a36db9c841b1998c67dc11689235e2bf87852bc0994dea4fc743463ed604362626a8d5629144340da09daac4359ed61610dd977f41bd459437a0d2643f902754e15fb3104c92456835102f631ef02a9197690ccb5a68c6650d345ae37be1921ad9b5d4421212a8909090881562aa842fa2aa91113658853785d79a20b29dad682c1dcae6ec608434b4a36204af6da6f3dc4bc850e0f09bf42ea21d93c1cfbf81778227075bf49b927138ba52bd4cc66f778b89a78a647c22d06932b33ad948b52891f19249ca54716d07b304af82c7b8a66293e6bd465e00f22c4ed1825bb6c9b6fc74313fb481a9a914deae8aeccd1dc98b92c35913302cd1b083259145cd7c1dba136ba1c76612d36991b554bc38621810d76b9c96ec92512d3b3688f6835669a8c63bf19ef037542a210424289521512208a1ae810410251349aaa22091087c06a1dd7fa4e904e1330c6e36376879b5617cdd38bc25c23c730265a51b91f2fb9a7069166f45ff3c07ab6a42e4d8f108f6dee718f74783f26356cb6763c3e4ec2c5ec7765a46976d82125391476922f0088c381ee1f6ad37e22c87a48b8ba669ab34a77b311889b2b5ab3586b04a2675e84c659c18787a94d70ec59b95cadfa1a13fb48eb754a9b8cc9c1c34cf71394451714243190265093e145de114c48a2b7097c89623937ab62bf61b88f215428cc4cdf7c0c2185cc2ec602362b59490cd1939ca8c6acb46b5efe43aaaa1054308a84fa8458407c33c6641667d8da9f9c9bdfd27cdb9370a91147bcff00413a96486e5e7b17409531eb97b119d7d67f236444e1973a7c339750f8f47a231ed4f4217ce10c96d8a6d3f22cecac9b5246e8ed62775a976c1b45b735b3b1338a5861c1a5931560a19a39beab96b7f3b91e5c39294f19182136c1724f13b99b578f9ca437d9ab220d6d0e3f413825ee1ac8b253f51726130d9f463ecd7d1546cfc975b4a2fc09d98a11732c10d48b13c8b064635d3748ae40796b36fb096d6617e47c2185fe1fb1ac6c3a2062df08275ac2b1ccce99fd0c9a657a6ed6d50b1cd56a854a0aa7950d7ad7131313a2a1cbbc3e7fa2f73cddddff008784bd589c3f615a1a632f0790af967fa625d09ecd41f911bf71fa422131bca22d3a3644b4e8d2f3c0f75a473d13fd8b7c4359dccf326a98f4eddda6a7e43ad8771b6965697d16c3585063c177ae4b306bd509ce2e5ee56ddb0159bd81dd2cdbd0d2edb2ebe7989c1c96458489d945d117b7ea2223b0d27a218925625e971f3890d469cac6a86d2f122f6147166df8e0876e5e85e9965a254bc568d6dfa163fc1d5a17ddc93918b0a9a890bd889b96526e3c8948813f27424f30cb68d1242262d9e47ae3cee3704fc0567e03692e118371962f6170ac321b4dc7817bde0dedc5da2f496cc76d38d9e46cd56c3ab0ce688a18653450441104f49681404a1ad115106b1ee7cd25ba1e2f3a8bb0d0af8a4f3443fb23f511110d9f7123bd1f66b23dbb92513ac19fc341601a25332f6e12d77c6044e783822ca1343d59af67bab0952991b0d369edec213eacaa64f06cd585e31c177dee495e322ca7816c6d3d44bd17cee23baed215314d565180a49a77569fa35c7a823fa279045e749f331a44a028b2790a4cd86be4d0dd084607541fec5126ff00424dc5610d4b2e2d689132cd68abb0f9350e332898a9b40917a162135231ce0c27a992ec655c8d1262d9dc3096b682f2579aeea34e56afcd0a8dfc5fba2461134893603c7f012a1a0d2884b2b4c35852283a5141f4456b832dc325c0b3a513c0d1337612116cddc594bcfc084c88f52124fe0be913bedfdd8c9942937ac7e39b17311329537dd298f171d9529d954bb735e68ca691ee991e03b9666e59424774e44ed17c6cc5b402ee716f88635436a5160f6dc59c6975b08d97766ae15d9c0daf30b4ad648dce8d18c41689625bf017e842f49ddb67b74342fb34343155d184e6b159b262d45a513bf80a9b29f6d1eb2abc834858c6cbd9111d3b5c174704c263704dd0c24c0eba5e02f6f61653f18e79a6d29aff0079b913792971942d84335d1574d3a5288a2a068a78886a8a744fb8573e46d1f90ef1e0681aa62be062e68e48c321b1a19c08f891249b5a916deeb8372b5f387e032e443c8dcef2ef5c45112b256bb6bee58558a9396f2b5f91db47b2a1ad676212710ff1490f614435d1cff485874d8fc13c7b0d6d5496a47b3e7273597a9a2d9bcc6e16bca57e445dcc84af1b21d7b31d38d193ad02cf7e3a30fec50c7d3a08c8e86ba11a895c59ec295c48819aa88279a7275f101ee3317f9337c3307e02f6105c42505a5d0cc8e0bf6998b4996c8927663e1297b12b38dfb928bc354f804c7114244d13505268bcd1b4bc7d7004741a44af4fc0b5c70c4b8b95413674a29384e96e5e4f33a84becf5ee3346ae8bc61493c928f8212dd916ed2ba64a16f0f6f13ca741d8cc8c55a11a4c39e1fece06bd509ce04b864bc7863724514bc60bcc68a44dff00a48f59cd95750f20b41e25ec28ef0a0ee8789270f4315162d496966d31349b24259104b7832e8f7444fe973d0bec15628c63c512326836646ab144a218cb1758fced242682e1c57f042fa333377f82d832ee5a1a27c1ef8b5dc66e29ee447456d5613d039d089154498a98ee8691d69858543a868ad92e3de1b69296f45a891c9b0e5cba5b696270d7a9ef5eabb8a63082a2a1e9e47f46390f7276b53b58853295a9aa6eb0f24b862dba35744428c3349c03a994faa14ab2d70f7566453131c235276d36152632d561647970445a32cc40dae50f4493b2171e6b824e15dcdd08ed9f912aedaef32374db91d8672d10525d7c7a8dee4a7e4268f31b72708316b7b46ebf2becd58822b14637726ac5ec7b875815150cc3b9af8a70e82784ef415bc647f8221b813bf819780c4997646de4c7919dd42862046e45d976d6ec1236455d082394cb31e7132d1e62d688b34868350fd28e3c92d27d86cdd9032e7b085d3cb5d84c6bc55f917d9f0302a28be63c391691fb0d4a2ceea99e899b574d08b045289d0599d9124ff6099b4c944dde78bfa0b49272c4a85085496b44fe3bf4ae46ef129205f476a6d5fe02c7f0ba544cd4a5abbc9dcb8354f09237d9f50e06495a15d908da66ebda2ac026a0b545f2356344d24ae2763b49dcd0d619c12657e7ee5919e46a28a155d52c8aafc8c74eaa71666b67c7a17457afb16176186ede04f1e6cb1cb062c6a2cd952d142ac8b96d11f24c6a322a33415c320c3dd6ba0f1785695a4fb2319ada4b75af5da372489a33168448c92b83611913771a8b7fe468c9377f248a76196c4eff001a264dfe365f81b15aa18dff006204f8a32e86472cc844169eeb0384bf066eb50ec8e6e9b29d9fcfe094efe22f6de05aeeefed0172689736158e2e88ea1c3e17749e97eca2cf613f52d5cc2781f90b1bf2c6b729fa897774246beec9ab9171ac9ce3dcb53e02bd817a127da7155d4e8c62f61510d889e95ced9747088bcdfc1d862586cf29c1027644c90cb96183f4366e425fd0c3dd898224572259577bb226ee31908cf22c63492063f018b0ca2fa4761c128b61daf1c7e6848420a20aa839d0f0870caf114f0ce11b6526b9af01182a1313a938a93f8a635c4a5f720b954a5eff00b34d2f8f1344adddd3ca3e138e8d29baff00c12bf9804ecbb2269e3ebf01f21b69687f51e08b958b562f6cd726a1ee23da72c3f1253161f81a89a22f8c8b07d8fcfd852c33927c5bf6194b793d6124378e222e66ed398ddeec511284b94ac40930511bfd8aaa44903c2441225240c8f2ad85a50ba37a31d4652c658eb06e9fe4a27293e06b46e40b149324f74cb67b1e450b416cf1aac4d8531e2240632ea886a7225d8847fe869e82082e86a8e7512685b862342744f91b6c4c4c422fa0ceb9976232fbbf024867a0470493579ec12b1e2203a28fb135bd7fa1c18fb40585d90c45f1a2476c93f13db1b4ca14f850f1631ef612a4c3bd5b2574219bd5f5493f527a9520916489e9410877aaa9d5c60ead1f22c3e9c0ac976a564fb0d3c0795f1935a5dec2ef0c5091da12a712942b254641048242155f44844602a2ab1b1d17626923744a082425744e8ce5924d1e81e53a10a5ebe5348204922c2fa5e64f80d18ac5d9128478c33d60f5dedd3c95ee2fa7e521312b24494c9d9a6691d495ba232ceb68b3d2a8ab02a37d38a330aa57ab4a3c79d285c7e6e85f1d7d88566b0d41b761c959bfa0ca1b97e121659b546469d9464e262ea3b9a3b552104228c6c7d6aaa40a8fa0d0e86242091208a0828821ac48dde6d9c90497615d198c788f12154893c3ef984b71e817b0d16431c2176c9e52d4117f556ee7cce18d09e97a49a4ac6891222f56c45852c5244a6273d29a34b767a10aac9d09826c2dfa62a8210844c0d834e93779ba2d76efe885b3d3c878e60767d88c7ccd0d5cf881552fec857345d846927d0ab972eb48484ab23747455c4a4820e1ca34696a4d5ae82544909085a9ab0b1e310d6a1441e63da11cd1a2fc5927896116427c07b5681dbbbc9c12b7f2917ca12fecd33377fd1d244843234c85dd8ac160e62e5fc42132e5cd128a586e0599e08096ae5b0d744c33708d2a983025f23b08dcc510fa248e69a094ba2a2715d8546ba5fd0c68a212f5a7e817aa0eed0b27a425830e0cdb9346496b76945df1ad6132fcb26544854631d5d5c4218931ba77a22a0a2d0ddc9e88208104851212a0aac0ee2c896d93cb32131e346b07e53d1a9bbf53de49e8ded533ed05d98f916e35d8bb307837be3912ddf811c1c8881b4a8b98cd17c99d4613b0ba2298d4881409e930863a140c0627260ef5b2284a2884d2344491d502a8fa0de7b9c255c9773e6f61ac1171dfc264ba5bd0ececb8da3e06bd8c37e42b0c862327a3fbbad0a903a31859a1114354bf7146886d40764a67880988554848422b4e6842151f6be131e243430b35440a61c1da4ec75185becef262dbb7b0ff000b41c988cb13cffe6a60f03f7410d3e0b092ff004b23b89c51895662d7b12478624640258945fa65a2ca13247718c6281a7a32491a64d207d0d51b18eb8108dbc4547bd4e6a8c1da7dfa23ab107e687465dc443824d17a7e86872b346a3dc9190c549786efc0b554631d4829340aa796832373c2e7fa2c2ad8897e3fe125244d6eade982d1ad484d6ee21d02a242120d722512e8219d95c072c516f40986ad3f61a767f47448fc33d458e64de8859f956a60dff1f81949f21c8e4889370efe2bc99751930c6a2ee2fba8c9f0b0f51296893c3a5bc0908b0ef4432212108ab4c4818e93ab9e88a2204243a33e15623033610cc2bea3cd681f4b8bc064a97c98f1128a2772e059c9782dc686b1a090ce618e1d56789ae82eb2f22152e82c43a984c92a4d093d89f81e0a9dd4b62043084242424242a2b510aaced1b676263dceea95b06b3dc1bcc1357957125dd817cb6c4ac191fe902e434b7244859df08c2f8cf8312ecb4e04ec248d509daa24c76da5c10d2e109bbdc4a28974b5102a411123293718ea8934153104d1585d0b6abab95169c0951d4dcbfb8ebb87ee1858243a7b095e5e88b9c9b771a27845d0f94621eb4226e353d042a450c2118c23443138810b362a155ce65790b304ba9884468420b239c71442a36337e2b3b220b64846466ec65ddb439e359c1601a48c58fd644b4acd9762df0fd1875f3b0b6c6f2af05b630ecb6ec9175e4d9c60c5fd043ebabcdf8377694ad1a09acc312dfe435763373b8bd948f46b2e46858420d5826d624849c90e2106d7162751f890b8ecd6b199ac0989cf4a39d642d1b20d6e8e343926f4546a4556c649c8c6e90217431aac8b62614cf35e37179b1a3b6cd7a1acb2997722e4fbd8cbb897e44c0ee2bbf233f3ab5136b496d4090c7491088e876534d48a4942d1eb7f40188412109088a6545463336335be637248a6ee261b37e0f9ee0f48bdab5c38a67f2bb0c6b0da43351ea58e5671f721ba1cce14ccec3416242da6c38f29133ef8488b67b18cb2c7b7021dcf721b1f19aa1f140e98d9f45ed298e94090ead4f65ee62cf71741a3232ca8c5589a4fad551d1d0c939a952947e35f017d2e3d49947b856169ae509cc7c408364b4232a59578a6e535c1289e751aaa10854187d042d4404f4aac11d049084a31e345d66e0dccc3a054923b93c919b026747ea31f690b4be221a155968e0f850915fa0a9957358211086db2e05b2fb97047fa1046ef64c4ac7baeb8334794f360bbc0a6b556b436866e679f70732b4a25bd27621b5dc216f11d3238d1b1dd1678365ae06ad718cd3562d2e7e93462f4a092e46323a1713ee40c55431743b62a8937a31a978e54fa090f0c3430aa96f52ef512304c78918b082c1f81ed0ea97cf810773bd2288549a0fa510e747d65291041156874a05d02174b40c6aec4105f201fc41f29c0b6ec7b535be0343f91f1f63e2b6a60fb3f63d411f80f40e492ce07a20926609c212fe0fd8bfb32f67282ccee898e043587ca45bc0fee7e4879771d04d0fd44b139fa2f1228221d197085ec21ff00149c99111d0910c547810dc1b0ec5aa8f527a1e1abf24ca1b1902c1691241660c46359bab632eba24f88ea422461f4a10133a2884a1c55368d74344515085444c743a35738a300f0e4c7927c6703f90f6a3c174b76cd3f0b1e874787d99eb07f977430f65e3ec5ef1eaa165da08fcac6879575e09e676887642c763cf17b8de604924b9610c5918e16e2428fa51ec27ee456e8312a250c75354d0916a448c91dfa0c77092d8baf5959b1b7e46c7e8663c4d042a3a58b70d349f0534489f69431f448dd29524ba5bba471f2a5860efb4af540842ab17432ed670e0f409c8aef06f287ca704bc27b509c0d6ec67bff006a1c924fc10f0078f1a50bca5dc7c796c74760bd89fc17f69fb971cb434a2791d887bc2477c73ba7a5d0b705150dac4773c77d46a4994ec6549244e8af46311f922fc51de906a2557ee2a340c33b6d93bb2454f1a253f8e93a085474ba0ad456e64d7a50ccaa179f51b1d122041d86c4206250822f127112771a5210c8ccd269021084313aaa343825f43a27f8dc0ee58f6e4df0ac3747f219ef3d8476535eacc0794ee34f67ee31cd980b08efee7a819f723e472265cbefd882cff01d1ea7f037021314cb28b9667c4264fd55b573d1118377c8864917e6a8d46418a3cfa8c63507a6965a34d1e154946e45be51eeac3caedd1682a9e468755668f2da4f516ec8a9bb2de451f43aa544207227a51d8506244c8523b69d4475d4add0b62139a4827d0545d6c89a09643cf8d1c3703e3727c36c489e4f48cf6dfb1078dee16cdc3e4735e56c3d03f7222b4a1cdc53f33e0ee2eed08ddca337dd8d86f07e2f63d31b50276b0c8dc9d98ce2c4f6e895f446a4546668e9842a2d464c1faa3316a31dc46481b17f9a18c781e72eaf0d316b50aa3b4f460682151e4f63543ca0a8b2c4c56e4bcc82d6f63c74c7d0e884878a313410c482249d902146234145ac465a1585db3e0466eb71c4c49d35f4da92fab75622f87071dcf95c9f1db741edbfc90bbf12122d4d12d4f8c897c3b31b301e6657e47c2cdbc7619beea2ce07ef125cf6f51ac6c97b8f1dc0d68d5d9097a754f148d612092cc74dd891e7e8cc5302bdc8a31649e99aa75660931e23517d6871e63b55291a5386fc0a9346a3f0109c9a50acfcc34f88b5602781fa310eecbf590dd04104aba644488130b684d84a3089d6201fa62aa1742ac8fe90d3dc47a2f71f29b570e28fcbf91aca2b5ccfc4f99c3abd03d85a0caee23bb412522b2b929f7581219ed9e6072b6b0c657c9189c50c2ece86b634499bec88936a22251f410f2c4820c088a21f445152043433284e832ec8bd9cd7322e797a8f144e842502d7b998327e10cb60c1742df0b8f2dae45de36bac86a8462862c14343886549aa483094084c554e8ba10875bb8206bff173e6373e4361d3cc9f9ff27c9e447ecfccd7e06a6865ec2d39142311e55130fa88cc2d645853a2fd0915626d48bcd6d2ec893c0362e26625618d498f46da8be9f5a4e2b2247e6aeafa6688493520637918d466fbd732df8323b065aa3acee1aeb81f3d2d17128e7170b14757581212a27a83090e11d298e31020c21313a13a2ea54c46378287bf71923d046c625bb2965f8dc4432df3163c7b84181f1b818e694c8e74898100d6b0bb6e43524c906aadee3f70189b0d42429c77209529f231ca65cf9a079177c647663e751db245943611f637049eb13fd1794eba660d6b7bff004d123957423194eab4137273d78beccb4b53f07e691ad63037021eb58302a222ebb518d0ee374b6974614676d73dc3a656d6c245b649136e96e98524c925cfbb5059d08d63508dc8e7347443aa4254908a8632144412150862463a21515156688781c50ed37ab8822f51e419f71e823795a216dd87bc2f85ee89d18788de17bea88343f01395e8a7d7fa5bc9efb082844dad98ee32d856b96c7772e21df4dd0ef124af6ec28355d5f71d5a3c21881b572d8fecdcfdbfc33370b61685e702bdcc2d9b3b9f1a3c3fd32a8b627c2c9062c877139c293ed040cb3e03d094b3b43d61aa979699809096f71902bd16e3386836312303a21535a31f90d4f256945f4c6538591dea93da7b8b2fc44c927a0d24121d9ac3fd8d84eb87a3ec312c31491532132d0d32583a21f410c26274539334257a095152463245d0a924d118981e9160e6eb832eea13512a5f9bb89f1ee4509ea3d237ad2e0c7ad2d0686cfe044e3aa68bbf337f624d8db52302bee5a066909df9e0bec9b4bd045ad175accbe5776a496daadc0a5158f0845d4a16ff00822749cc36bc8fc050634c2d04daaae21a53f017fd3c45b991e031e087c3426e9ceaf446d03d0c1e52cb26960ad4d054744aa1d511d0f0e9a0e8cc6ee091bd73b697e858e1f2fc3413c0d71741ecd86b0c569a4ccb09bc9ddf0edb984ed7bad6888a9fb0f3dee255b618c69e0474a109922aa425180951104102556451511248df418980b76645edd99ee23d4c6a2618fc1dc59e1170a0b7f07a1991ab1636d90d41f8943b663bbb468881b8b5d8ddc6ec94ec8242b7225ab642e3bd946d61e7bc1766f921a49a9702e04cc9d9105eccbe48186edb796db20dea44468408861939c35dc8d0db3c11923c08ba94b6a368bf678f73456bb8dbba6605d2ed71f43bf5e3a16b4d1d6f7b7bd8e0d0360658210e9344e20f4e1ebe6342e89308f076a6ca1e8351d2892491d4a65e3528254a10451d2081089249245d016075cf482430b11dd1eb63797f9a1ee24a6e0f87b8d65f958612250f421615b4435e5a429cf27ac7247f20ae89ca91c54167344e12e44173de6d72744c454e924282f1ea466bd43ace19d8504c6ad43447e043132eb865ea30204b704812d311647f8863c96808f2f76313764178222e502bc0dbb38ea8e9421d33d3bd2063187763d837fb5530ef8425ee324911231d1122080b3e0b28d884f2f3ec3b5bcbb53fc4063e99244c55d11740244c572061f4cf448855190a3292dde34f7a12cf65fbd7cadd8c7e39165f7fda8c16a4ddd6439e52885f24b142425626497a161c85905a8b4895a8967d89a05923c64b0d68aca29b1c82c4f288f78984891671353dcf74f08410d3e63d97754226e30c643b4cec3d895a073999378e1742a4c8dcd702555d2cdf9ab187a1e12aa52e0f77f232fc68c8151d174d2424a7c0dde2e43594d122859e3c8e1fe0bac8a65c4c8d3cb0faa442a5a0626ba9d1415091d589d249268842a30a6d47a6325dd188bcc1ee20858996767e639f71ec28a96834486a70b644509b15635d7345b7a9ec05812bb156bdc49890f09160c066b0ae34a5c96862e6b934e0699991abb93c74b89493ca635c16cee48ddf8242647704dbfe46e8aa918aafa086ab818f05943615b1cec5db84f6af5abaac766eb7be9919b9b80de5225b7a7c63ae6517cee36be789d1fa10a6cf05d7513a8842809d39e82e9091ba492493442a108c29616a3457ce4f7bec7bef7aefc99f24877157d94fce4daa577dc964c5110122cdfd8c0958b3c0e198302ab6312818418bb8b6c9ea31244f0411ca32e1bf8243b213743584f9d921338318cdfaf9134a571b6f7dbf65a0ecfc231438b5ebd743e8de885443ae1191ba33019792f1e8891ee18a3e9927dc61dd54ba18f6a9265363f47dc992ec6fca1c3fcdee68c347a35f323a374430e215185504c3082246c749245442108421ab31db3136ce8761696b19153dc257ee10c9068d3c9ab5049fa6a39f1ee2d51e95669c9890d125c8d04246ec68764238e8315de9c68285627e42f18d32f4437e9158792d3de8fd93adda5b06d84b7c0601e361c5a8f01d929c8949b1f90f0eb7d285d0c54747475bd81d10cbdbc9fa90f24d151923c1a160bac8b742161a37bdb65771915bda1ed74759244185506c5d6db124f42aa10842150a99843babf5172bb8627ddc2bff00981258768f88bf21a2d0afd85ace1b2308bc75a2a3e8b28b88311f34622cfc0ed0374925ade1222141670e5a7317f8cca1d8c87543ca77464b706c2eb5cbc18c3170d121256cc6694d354410e46aebc98556d8c8e7e9089a2a694744f4e8648e9b0ccb64bdaac94cea45f30e922e89ad3a1f4a0c554210dc9ccbf287a5c8977bc09d42b8b918a24501141a4501dea5efa9510842108427d08ac2d86ac82c2827a4eb3922e25cc609c53ef51ba1e1f627b8f9a9d878e1ee5c7f070d09a6d9eaff00dc0c24de1eda0d0d3b06dd646cd87a5d8b5b33e83069bd38434d18af67a687921e4b66e36250ccc765fafa50623a155d155a1d58364c78071863ab91e17b0ab3d0e842fac93bf14be8434514eb53a94624121527ad0a88422c65df464927ad698ba83132feff00b917a62ec36b5d972f7531db91f61e1b7dc72e25a9de16e63992049d9ea886ef908f7930a89dc4df84f53784b52b5423656755870347062e85d4ba12b11f48c5e963279aeb71026b3d593ec21740ba95649227c50fa26a2244c4e88aa2e842a210a88215151138dc635beda935d7d49a49249710cf240cd45fe07ba1bc332f11925139b7b09d57b89eb2353e25a38bc14f04cc4d6568c4a1965a48f38cc476394cbe17795b51594652c3d4b6a426baa35196787572256ef443c085d0c63ac0c75b40725a09f9bac0219f4cd244257a231754f548d8c856cd8c744213a92722e84c4d0a922ea421510a96ece0497b3d12cd0c7c03caf5910cf88a1fcf03f80c732df72ff4c2798852c0e8264d27e9410411d84bdc79894de33478098612736bdae5e51c2c91e98fc12dc4b191979095343cc8c3d5085062d066f0351a81e4c9587aa386a53cafb8caaa53db35acc0d51e1867d53d299add6a924924934ef7bd1d5084c4c61854a7421075ae92322152dd0709024794f05c835ab5daec4e87a65350c49af92e2fe845ec5da06be7dee2d9f41fc342bd4d00bbdbf8624ec6313a4d0993f4208228832abba469c5d9b438782e18ecb4ae783f7ec35b2f81ac0bfcca50f7122e9aded02b0723588891658582e49e0fcfefe8e05d5359eb221933e544cb7e0b832eb3249268c0beaba44eddbdfa508484a84a2954d74974aa2a21087a4d08e196f7c3fc174766aaefaaf971ff0013fb321e85eeff0005edc8b4d1f862798624d53f713f5f312f25e062fcd9fd9fbd7c43be4bf687b33ea5fbf431c7b54264fd28a5d266c13639654f75233f8147e8b1f90ffd2cc9e2866831f70da1927a15e8fe8455518fa07bbb51371b9367569f0c0d0fe86a2a662c2fa8e9d4f65bfe87f63b6be84e48f23c86edaf907d0ba0099082517b8848749249a48aaaa842adc1924d08c087db56f2586275db4e55cc6cf7468c5ab6639821aab161b1275916e426f0276a8cc0bc4fc3c9fd319f03d7f63995ea1854f1b7bc12e23c2e49227f4208aacc887d20beb2334745d41ec6432245bd8ccb27e8a335dfe8c922525b496eec8b2cdb7c79bf84aa652d945bbe46eaeecc8b1d287a54512171289c0ee365c2e85444d10842113037235646c69a72361aebb8a2ae25c9c61ac997d05e5c0f69f5275ab12f537109c276a87ac8bb38319e343f7b8be7d01ae57673fa3f051afda3d101aff7ea341cd48205d6eabe9be8daa8c3cb6213ea7545e9dfe848d0a5b496eec8fd603f97e9dc733d868ec86ee86448ebb527a10561281889152492454910a8854222546ea14e34b1e1d0ef50d6457bd97ec5273268bb253f9d8bc865cdde99f4fa4a024ea224ea2dc1701efa0ffc3f3425fe8be5be6bf63781da1fe8fc5068ce8f15d6c68848b0409742208a608a2a455aaae838e9f73e85f0522a3fa08c1d6ae57c32de192eacbb8fcb1ee79324dbf44d1ba2fd021c782f1c4a49303112493591515508448fd27020e923855f4d4b57a30b4ee287f96253b22c762ced2989fc84b33584cbf0be5cbd27ccbe7ec8fa734246a256c2de8409daa11f4926353f613fe8afa137fb21df4e6bf435b761ff004cebf009ce2fd0aa854c53acef9fa0ba5d4627d83152c4eb0210c9e8744217a4ba53c357d916863baffa21eed8db7abbb1b9e949151744510baa0c61326922748aa244210861dc6c747569dc099372dec3f01617e44ef6c8ed76488d8d635abc650c9631dc9f3f42edcb73e1f6d8d3a1d30ff4cc677167c88fad2489d61b1242e016f46ee3b8d61aa33a76368d5efc0ffbea7e589bf3ec33e851fa7b558ba7348e9d3a59b8e9d65b09acc92cec2a263e89aa15274d2e7b2efe790c593d47fa1cc867abbfd0515175c8e463ba84d55174a155fa51221434e443b17ec2c300ac0ad2c648669d5e6c24b1212e8c9012d1de3f5662cb9adeb865de392efe8fec2692489b7624ea2da46eaf216fc77e85d4dfd374743d98d2251b269a3f431765443aae94c497e0cd2c7a25dbc3fc2cbe1b2f119afe7bfd06212aafa46614844924d0a885454555491d1ba40256a39eb81b62c42b77193724c53020f33e322c32d234afdc60b285db1e2ca113690f73fbf24be396e57fefdacfd2621fd37474dc0d72446c212947e85d2875572eade1a88a88bb5cfe9f324ee6edbcb77637f490555442a4090ba613aa6a842a2aaaa1b1b1b1910db24cd2098a10cb512d1b1924935262118860ec3e8f6645e424931becf72249c170b3f147ba886a3fe4ba3a7d20f2c2d44160a8baa46ccab81aed6b7d7f43ba5ddee49f4d50aaa8a8ab1438c3124924d1084210baa46e8c52c93d931b6544a864b0592e16406c9e8b35926259a886359d14eaacc5746eca125a024a192cc430eeb61242d38c1fa2e8ade33e591a8fb7557f62cb184dea46644263a58b40fb0f02c74b33ae0d3b79d4d45c6feb155d5085542a184e89249131310842eb9a36216e48862645d0158b9968ce9364887d14d4442c9d782d33240f6e5934e48529cdf75666a10d9e4910f2bed174c754f5b351aecf1021b9a2811cac61a50d0efd2df90b56b9ee35e5b27ec285d28421550c263744d150842174cd245592c0b145532584c8b024a189151d186c6fa5410c1fe86c85d81816b896c8d832d74f55823ebcfa887d2aabe9b249c31e17b8eb21b672c419248a2eefb6a3382d86fec8854754210ba1098c2649344215085d52256e442e25ab23a10eaac437591ba48d8dd1128b60c48c48f7d4da2f9c1823522ebc564b4f7a83cc4346416653d1a14bf07611a70ed1d51f5d7d27d0c65efb18f0bf45cf97b099249a7e62627eccbad0842aa244c4e841310aa2174b08325b13b1356c7421b32a1e8d8d8a8c7f416c72a1c7161c9ccf72c5ea5a8f0d0b1763b180b86bfb1df3742bbb8dcb237bdf4263a113f7c7435bbba1e1bc86849c6357b8dfda67f41085d69935215442a4d2315cc3196a606c91c8549a292351ba2249ea55d2d300e439f806d44c9cdad4650cae1d860d6d7e084be22c7c79997c40d47d555917d57d266ba15372cf8e2882df127e8afa898bad7d02491313a15084213268d589d8b21b9ab63748ab7421b1bfaabd504a226b0959f3350f03f01692810be2c45bf61badbe656449225b187dc6b091f4d7da3acd676e877664bc79125f7fb7795d68542eb4c42a884c4489a5b81cec5ccb7d0d93d1236211237d33f415098ccb4482e834fb897795491b58b8a448bd23ddde63f85a3c1638a75d27dcbcabbafefef9d47baa8beed91246230bee227d68542abe8542ad258671f91b44ca9be96fe82a493f427ac8492adff216850367517802c64981c0904c76435122aab496fc127f85631e1a86b4fb27f45d0e879ee8e88986ad03fb84c957521750c744c613201ae4c42dc6b635f44924fd0549eb7f410c375821863b138a30a98cc7158e885b8be2f44b326143da5ff6351fe7d7743faabeabd0c66b9963a21f4fa2bec5a09289aa108449248d8d520211a1b9327eacfd92113d084fa2a948842f490ea29977e04b966f0b5489b7b9b8623171a890f6d1886196dcfb0fcb4e88eb7f623d8e837ddc8abd154a9046230cb0dd931b8fa123fa1359aafb827030a96d19931bc069424441021d82c43143b01d06091a0403c0d618e8fee1bdfd0fefa49249255249e97d33ff001551230e2395378d781220b161fac681ee4c73912dfb0d73708d89b49eab618c6d351fda31d464aef4b8d2dba21b1f5aff00c6aaa1f48521ae4483a82d1aca9e6939b89def2e781afb2b0b2fe9aff076a3a2e229d50fad7fd79fba9aa4d1481943437349f3822c160d022a8d882c761edb54ce52dfecae5f15319ac4cf82f0875761ff00e7492899c0dd37ea11413538b4f1d0552fffda000c0301010211032200001030d941da36820bea89ab594f2f4c081b1f49010e7f2011ba9c84e9a858a664cf652e5d5be2586cf3905dac1a04d04e34c3cd08004a55b7156e84431d2250997efc78d42965d96a54cbf48b2584b710d0de3d951cf47149c5bdbb331fed66b751a6d86f81846a040841c2d02befd8df73d86e771a3a9f6deec0398dfa5aaade10c80331014a6270e4986973432862e3291cf12c89440ee20c2176d76a41790da395f2acabb3df5c74e0ef8f0efe54d94e7f6cfe8a7e3eb1fb496b3271b814198aebdc60a25caea8d71567bd08e7d5c106acc9805c1a241c081f67373b8a7f05f5f22b3f556a86e62def8b5fb08e2de3e7f8e2df6d347279ea9edae29225f28236f5c30400e810f51931446e55f12ae7b94dd7e05af724d8088d76919f610a27be9823bffe34cb8a38fb4deae77d3cc39a70c2f7ff00ff00385201d416c781cf42a204c189d3bb85ab7d8dae88e78c11a8607c3beb5c71534d727ed73932e534335b4d6daaef7cc09bddff00a6104185105d1acfd4d1472a1c22c8154f380b3aad063b342f030a2f45bcfce5451abdca993f0d1dca4aa39524601ce9fae28aac1a01041313173d65a4e30e1810ad70274e45e7ea7df9804379ce29d848da16210be5760a7f769bc3b22763c80114c1fbefab5bc1017aff005492dc02f2c913b2f4de8881a5019ee607dcfdc452cce55652c3e55e56c16e57e99c4fc4946c5e1da7598a1befbeeb03976c5a95619644f68615cfd5fae7db670c80d32ef3becfda5e07c67246492ce62c218a1a6b2230a34bc1b7b7876068f3cbd9f887683ece73d942729062a914ee3370ad60e912575b020f2c4195ac2057d449d7403cece982fe9373a750f13fd2696ffbf7cbe26faabdf384ee7af2d040a2319b6e80258e78b10fe8e1d8a0692c6fdc9b812c1287f2758eb4249aa068d9cb8ebae35ed2c29a6e932733d77aa033f2a561d3ca659c175d2cfb9aea3d51c3a3c7d4e4bd6cf14211e449fb00e166051cc3c87c45b100f7fede6b7ffb0dc1f6169232f3e3d3624e729b6f869b223b4c34897eb30887f97a9e2c777ef72ea51369267a9efae0801f00a9cff0e349becfbd6897be9d2af2fbeb8f4b53ea29aa68a35880edf73eaa688dbe8bca2fedc513aef4684dd53753bdcbe88b8a00bf73de7c27f73beb9dce4f50d0e21bed1575cd16fe5af6bf240df74bd8f880fd93c9ed630b27e26d4271e651730a62338f1d6a18f0ebc86def9cabaebf8f7d73c6c3c7fbe7c9e5aba83f9786f19d2ab93c01fbcef4daeed062ba1d417752962995d5e9325969776a8eb8b4a2fe34c797586df0235bcb5d6d1c65838d8e4aaaa0fe83f4e85b30354e8578d3e2f0182349f44a4f958fd392a7e18d502698ff00ef4ebdce0506fbf3784509984aff00e7dfbd28c2c50b96cd7975696098dbb15c4e481fdadb1e10f266aff4a5d21ee3d87159c324a6b9a6bb8769b850fa7df69762ddeaaf780080e76782e2ced287bb6861005e52899e27ff00372bcacfacb1e8d911813ddf2e2c984d08e1f51279e715d1558496274c06fe8ce43b9edb53d45dd95d306e451c0df3b20c38c308342c414a76d91c8f6881503e58618e323df88e1efbf0e16174da87dcab1bb3c9b4b74361a7d620518cf58528c0029dc053cf3cb12fa141c3341e028b4f0e2e4f1a2521d0bb646b77765b6db55b053a10d241d019944f4d375b41b984707d0228000b4173cf3cf0c8e273cb49a62be174d945610b4da690fbae690afd7669265bc837603eb8d7d7111071c14375655c5f214786a003f877cf3cf3cb3cf3cf230c34e2dd3a9b3c1c7d02415c7b4a7bf13d7da59f5d92f03cf3cc9d4320a5266569c6988e87e9dc140016df1f3cf3cf3cf3cf3c33cf28acf7fb3a99cd0e801d113624461e517b9e98dd5f3cf3eff52c378db03b37aa8ecdee6306d3d528beff003cf3cf3cf3cf3cf3cf28128bfa393ab2a921c4f305b943506aa14e7de04f3c317b3addfc928c727ae47eb2a915c188d90005bafcf3cf3cf3cf3cf3cf285db583e7def2292ef1b6cc2d5cd94a50066697cf00ac145269df085608a33700ff00c5263ed1fb8d791fd2d3cf3cf3cf3cf3cf283e2cc64fe6ac13f6fc858756f3c4b7bb3e5973ce55e8e6c2715958278d47fd0ba1cb5e39540ebda7754927cf3cf3cf3cf3cf287fe2f74e7b8383819bf2813dbac60cbe64a0f2e62b786b6f2d724e78e036454dca3e2312ff005cf775f27fe75f3cf3cf3cf3cf289f4b0b7c61ee0c3347f82fc85544308a1396f0b680c55ec6f447d468aaa3be5d764c07d68673d44970ff00a24d3cf3cf3cf3cf28ba94921feae0d972c0a8a2c8148520d09056f2dad50f2d659365d98ac16449fbfa74842a347352007e3c5c9afcf3cf3cf3cf285eb5dc6b3bd08d699f5c659c91e710352cf7ff0055a9cce7e708753c1753cb32b4ab2c51af541ad293720096f419f3cf3cf3cf283d3aa4e97c5b2068ff0006b4b1c9cb3c95e21f975e6e460c44effaf43594911df5ea00eac10f757c20a39eb85bd947cf3cf3cf28591e908de243996e8a3ef0a98f3b3fcf33437ec5741701c8adf358a813a984d6c71df65d37dfa7b52ba5a064ab8fcf3cf3cf281a26f881d4177d2cf6d490a307cf3f862f057b14c1e396075c0709807daf4d260dae9c5f36c015fe3f3121f0da27cf3cf3cf28dc4809250745797ad83f86274c000d4566cb048e1e54662bf2114f5f6509d9360eb2347035b9ff00618cd7b59522031d3cf3cf2830d54da49c3412f6d2addf28630b4d54129ff2116ca818562d1eb99fbfdbbabfe2c6194abe465e9e58fbe51de20050bce6146894484f6fff00552319f7eee9df194d59917165710e3e49f9eaf57802622cc2587fa8932f085f4e7cb69ead31007ef58d41ae49aaaff73fcf7abf395c031cf0231e827157d750b15c8df9d90d344ee524c08da7f60c08c3df968c382bbc6687cd2eff00fc360419a1adb50f0eb0cf2cd62979abcf0b087924cabebf05b4fdb749da6b68276af110acb959dd746fe8013e8759ab6b95ff00bf19dd0448ccfcb33e31fafda0c68cc3f565afb1b5df93bfa97162fa4c44b3e34e40d67fb2570ddea79408badec6bab8fa62ff00e36d28bf43bbbc932b7fce192818b79f5b3b22a9c364b4afdd417f4ae50b88cad6a5a59fe8324381f27467034f84d14720afa480547f126bdaf8b32e36f30ae6beb189757bb98dd0aa1936f77a50171b0ffb38d5dc490eab60aecb6baf18c70b4db853711f5373ff00fdad81f26aa7adf9bb5e64f0862d1597c28112cffebd5d470719a8e5ecce9d90377c1db518e728831047275fd8c19ebf34f3e0c94a811b69ed13c8c33bf7dc12f9f1b3a49136d681bd3ade8edc70ff00330ac1dd7db83e1928eb77c541d89a98f578d51e3719a3ca20823da08f6ca24f8f7bc7ab7fc0a1df7546cb487751974a3cf73778cfb140548d5d8234571042b88715f8d805dfc002c0c208f1093be88b6ea0a385e4153c8de144ce6bfd8eaa55a52abc7df3bef83783d5d7b40b72148f62ca3c8e0ca779981763ae97835da6ab1eabe23ffeeecd124bc8fad766c804f34a9f61b93f3ec36a09f366be13d3fe921aba1c0ec6c6c61aed87d5ca90c41f924f3322bc003b4f11137c99d23a08e781192d482f6028d9d680e8993978def767ef6df3a862f3f7c797eabeea7b664abbd1d7f02ecd038c7b86fcf09779f5872ebe0f7fc64b5064ac7546a7213a97e4cc29ddb79f3c6597394d34b62fb6bf6577fa519edfc18b7460ca4a11cb9cb6bb2aafc6a01b4692c3d921dd3eec804981e3a4802a9cb4cc93c9ae32bc6c0f25bb23f4d2b8dbb1988e8f35dd730217b7e73b2c9fa6a3fe59a1759268e8f4ff0065f4c31b8da6682a3e127a37b976acc8eaf0dec0a97c0952f684f3dd06525735872b5e669e2ffafefa7cd0a506ed310bb57bb715b6592abc10760da143edf3a7eb55ebe3860b16698f375751447aaeb0f0e411ade1ddecc73be0f6d612e57f92d02108ad92a90ddaec6804a871135a972fbff72c61a33354d3d1122b385a718a53b9665841388d22ef2de02835aa78f19e2295dcb57520316bdfa8692599cb0c092fab3db2da22654f4e430a1b0c861456dd3f05ba792de5847542dd2ceaae729f1aa1a7c8d5f0f1cc2dde7cb750bc27030ff21fc18759814e09e85a9404c9c74c0a6ad26dd7d242e10f631a852a7934c7beb0f78cf77aff0067d4b1dc916812e60618d610025f147fd759e6fac96edb9fe31a7966f7a194856c12e5a25bcf39304a19e9f74cff00ce7a2e827c095877636c7c9ff106f5654c942e0e9bed1ae8d78fa2635cfdbf9393aa6a924a5d502b97f1caa2dc611e3cce8d66be118cf8f70f49342413fbff00c10634660589b2a8d0e7caad9988b091f9eb8a7362ea4880bf83ed02717ca0b465434dbb1f6978a2f476878ba6c4660a9ff73ec1041fb70edca60648bb7f7d6e1d76878e48c8c512e52c9c2a3b981b3b43c2f5dbc05935acc428301f3a5316e53e3099fd30004105bb13e572a282fe86e9aea65e4957d7d3e6cb14e9f1ff00520047c9e7afa50418086a0f6d9e8706eb8d35926497443ff0168041549ff377c670b3d503b56842abd5c177a17ce59500ff008ced38f84fba40382e1768adb8f12cb33ec6f8414add356dfa456c104134dfc13a2df4e497b9274e4387a5cfa7cb00ff004f7df59753b2e988c2a6ef7c1523920ee865efa4cc9abde00cfdafec3fec1041055d43f4258524628ff2a5ed87774c1d1467b1dfff00f39ee87c09cbd43ee7e9eecb755d3b91e02db9767745a97df7e73b041041043a41473b4d842f653673cdb3d5fd0cdefdd3ff00ff00f7ff00edc45ade7682fd072c4bc10c33830052c400a20314b1c43481041041041041041873cf3c718c18b1871cf1c31c73c73cf3cf3ce10838028b28238724e2ffc4002111000301000300030101010100000000000001111020213130415161407181ffda0008010321013f10e08449d457a15f4faa297ac42463def8c3a8c797098ac4e509c62111026e1522b268ad70f3ac514562cad29792f92ea6278781897da27d87802ec685761db18405c692186140816e12d1eb17e966962f04e8537de0f2a329209122c3c12993e4a5e771313c31fa11e0b8fe8fc169562c33a32ff6306e5e4b253fe858b5f88bf117e22fc4fe22fcc7f98ff311a44cf04232b26e1b654511e1d9df2f7513e0ef9a13131bb1fe0ea83a0f520bcafa31ddd78234306c8b4560816413060604ff0062ff0004e3fe47fc12d1f878c53c9f1c508427c5191897c69e262620ee8caf997902ecec3bd10718692287c2d281034239e2b0bf90f758e8c4d7d951d1d111d1d7084e109f0dd6c8e178513c4c4c4c6b8aecbd3e8c0af03417d91e31d9040905fa0905fb6225fd12e8069f41a8aadc5ef1109f141f284c7b468853f0bc573502744c6b547898c6efc3ef4250629631ddd78329e6f24c10fe6f358af3ecef3a105136765c6ca5297294794a52f0bc126172eac5c10c68278f67918d51f433e9153f043519e81d0824fe84102050502a1315d874bc849967f424861a87620d72ef0dbc565228ececa2b28a1b8d794ef82e747de278f43c62643bec90bee8f25bc189f78542a121242210f069e8aa82eca1b1d18d511106b2cc659ee3dcff00ac51ff0058bfd3fef0db4c655591c294bc689971cf413ad61adf415f64c4ff007840d4c78204bf6222c0183b817a013c8cba0b68b15b625d63431d3b1d3bfd2b3b2b2b1b15959659686da76578b054c4413d272a5e161785682d4e0e2171442f0876361d76c92095e6365d8344e05e6f8758dcb286c50e10d848595c694a265e75b83d80b4ec83e809cafc2f8248d8588d0ececef67c27c5fc9084217e04f8262ca74c7b486095c380fa8b09c4f8a28f71d3101926a22ba875e4115eb5b45474ca882a6543428d70bc5fc744f87d08595c3e50db1e449d8263c1628d224629616f4ed8ce8bc212090c363c7b47ee36543124a2382c92544ae1fd6208f853d4f83e9e35c98d8b06853e82fc0d2d109194f07ab6bb31ed17990948b9ac635ad0f5e3e699404f4439fa75910b8b5f0bf83d3f826b783f43193251d8e06e90bf7c03078d0b36c63e878f83d3e569e89944a94563ef3fe64271842733d3c65e2f601c29756244628ec575b50b4884f0f2163d78c8318c63dbab4af628c631ebd2654409c29d704b26c13c38d5bc6f8a1611ba852eac5a0ec848fb5921ea17a42c685e6418c70f06c7ac63cbc4109594545128b10fec90ca2620962e6b2bd3637ab1858b0b132884c5a7a0636033a21df808420c6e87fe8e5ec78d0f6859b6d1b0d946e65e4d9248d1652a24a0f683628ac1658b0dea1b106be07c3e259e84824f2944c52fda39abc73c475817f0fa449d43af93ea3c2946c68528d8e465975c868571b1b294a5dbc4bb2f025c49d63e3ec5626d68bdc1b6dfb8e788577f4268a345db12906b52e0fe098ae6ad6c618d0da207f9c378a4145418d1975bd26529316a65189885b905c13e3ec632c42563ff00294a85fa162d78f4a8a812a329d036881e12422ebe843d3fc09d1e60c3a2cb2df49c7b883b4fb094abd1a9c637c68b214a2ecb2f1528994a262628c4867820ac7c11ece998a560d7fa082e34743fd62294e856328c4c3ac1782795fc316e9e0fe41be310eb80ec28a1a9a20b9365a5131310989970f50f928751253044fd0c2dece6d8d5c4cf78847a7e1f4bce14e86a75cd88f43e0d22073694bc18b13131313131c5997c7c8400f3e11a5f14fe2f0f5b07faf0666270617f8ae27b4b89884c4c7ef23e4d76418092b2839b58d650d961a9cbc377fc3c0b7ce37e7a51dc4f91313167b1ef11a1fd9f82d661fe38b1b2c2449d39a650c0c35bef4595e3778a8e8f71ff00916d20c588a26347d9d4bdd42fbb1091104c9d1d15c19d85a10b148244c482588fa44f1689a47a3c19fe6916b7c16b18ecce849ea3c310f71552f36eec54e8412108244c63193611620d7353b43f2ff126528dedb4684a65c4fb17bd1751505a5e41733a1134a125b2f70b83c3ca778343435c4a04ec3fc67d9fe0b44cb8d946184ca5c6fbc2d63c8ba99d8b43a204d9b4405eb084138b1e4ca51272ab26ec5ac756244f9af31144ced89383f4612a84b8aceac1ab3131e45c12170a518a3d47b1ac7bd1d369d5cefac4fe34f131b1aa4109973c0b09d8b4aeb8a114eceef099f3b2da5983d54a320126fd7920e8d9fdb7c13f8d0b1e513184b0863762712db95e891e263884210b65cec51b1a371d15af4545658f483127c030ecc792a7ab689fc498b197813c4317a276e68478544cfc1acb434741f5d6120d58d10d0c5945479f7afa0fde2049be84e27710be058b1bd4517b8437d1d99f7e6a742ceba62dd8a90a34123e8610fd131b833db0d5186a62542ceb0bd3c67d07ef2943fc8a04efc6845189c1f427884e843f07ecf0fe0c562830976753b4483124f03767764e861268715fd088fba3074f4424c49c47d8f593db2ecc424202745f023c13b8f3d11709898c4d13b3e680b1616f87483e8eced94c7a109d8f683bf476468f0310f306ef7bfb1ef8491904c699426d09979a434258c452898c2c6ecf6415f35a0f0a311aac3b1dc242569968f9420f220c5505224b32e8d747bc0f6c0df050a51b09f5b753c5c52e217637626379e849ce4a6e9839a96148d0c67a1621b2f26e0c378b17d0cf40974c40f61e8742b41a54a915145d7d8bcc705f47ee78109d3a2452f1a265169e7a3aa79a549d20f08a78176358944ec7e8afac2b4bb11d083e86c61b1b18c5ac3685433bb3869d43bb89d01baec5fd1e1edd17a410831cfa85ba635ea10d5289886b21329df18cf42c35c5412e651617a38b4950c4fa47d587f808a8c20ee18a3631b1a18ba64a64623ba6cf22044c0e82d82487d228ac8a20d15f44a767b1168b9728b5328d947851c08140b11c923b24b10952848f0d482e06eb12765a3115b38d8d8f0c684ae0853098fd040422c1d4016079497d1915e01d3b2a259e001aa2510d26a31ac26d109f594a5ec674184f0bd89497485c50849f484a891861ca28a263e0e7e92e13b28c631e7a0d5d10277e876f4c6a0135d0c918675077b6780fce0b5618b226e84313b8c693f44765b61fd162944ca379a3ecf7732f05ca85a27cc718618613cabd60ec6763d146c631f7add849da1ad45e8a45242097bc45a2cc96bd1d64244e31b0bc2ea1a173a286ca26510b1e275abb2f4c5c68959e3ae5a7131bcecec4a7831bb9c8e7e88b4310b04ee35063ca0d1d30b40f259d142464eee1bc3b9a83fb8e988544e882512b12328f3b76e5132f04f186b47885c11d5c33a84a2184ee20ba1c68841cc6da186989298c6318d10f27b447778354c4a295c0a6cb060345e237e09d9437e227b717589f67a3c5e97822c8921130530f3a1326121072f097d8bf42b5720c6a9067d50fd1f049463e0cde89eceef22d61e8816c248c860919694a3105da5ca51b131a53a3d0bdde2e0951228691d49d8a9f9c80a1292631be33105a19e876087bc36ed89d16e8851e950a687b10f3a4532126317486e371b14a2652946f289e114eef558b133f425a78771683cd046bd1318682141318785f89377820f70711d50344de6542a2ec6f43f03fb1b58de2eb1b1f658de263c6f109084c7e8f18992e084c4361f906a074ad20ff006f4fa929c114506851bca510bc1ac7ac7eceda774a16ec4d3b027d15758dea5586e16e3c362294c43da263144f12bd0ac5c22ac686bd19d2347d4033050c4f26e8451bc10b58d0c6fa1b8e1d6c75d6a221cd8676079780a431a163626798c42da513a2294a7b219962e1234121a27d616ac24b13982789f05c18d61aa41d44bb03e9301dbf7898b1682b64fc23d9484a4d436519754a262d0e9c258b433441ac33b329c8c30848420c8244e26898c631881a8d465b1443c820bf8350ec2e8b9d0ff92944c6f1f2228862f33b82c521082685b00d9610b104213820c55778e8ba862f1899ed0a4420f5a1d7442f115ecb78c64904ebd0c41e170788258c5895e0b82c5a104083435a3ec02f01c91410427263420f1d98f78d3f401e0af50978c43cc6375e8d0f1b294b9ea2194fe8c5ac8413608bf2508485090243c5948aa464dbac4312e507ac8242430848fd3b3a752567ea127643462d8816c43c0f5f62ff004347a1a6b8365692117d8d109c515e57a226d0e81a822fbceb3a30451352c486ab9bd7a85518f6668a93583c084a8690c3cb21814298ac2dfac2fe4413e0b9dd8db45cd68fdb93e890e3b4decc4a0f104b3e39be4a50c6a18c2ac13b17d91340e8981349d620c3430cbc0d189648c4a6d1b10d94a33d8c69b3c2eac435bb03b4e216904984a882ce5a3637c50b17a31eb0de242c90bf8567ac605080244ab0d0c3c19621368f1b141427b662cbe344244e4931042904389e5ca5d6ce8ab1097d839ab20ca416255823d099dfa8624a5015da210686187c46ca3636518a512b1305deac2cbc7bac7b5898c52f252561ad174c9b4121ae84b107d228cb97f47f1899a3c84e112320d106f28c6cbc48f44b47a4048eb1be4ff5b30b813e269d99e20e7ad894d7de126244cf22578b4923d6111698264d590852947c5385a262f649e89135b2138d8263ce82e098c51aa559e3f61877e1e8a88412c20910488258c55e1f58ec20b087081015400fde4f179ab17b12e928b5e25cfeb65ba5b6107a0c6783dac416a6762418913592920e770b10b4a3a4363bf43801101b28df7c1f2f42dc6fe05d6cb589725a990a319d0d98dd9690825c5e21905af898ec47b6257486c4a8e078205272d3e0f606a387a2a65882ed8b5bff000c27082c98d709cd9e8d084d419b635f6c429618d64c1fc83c5afde481ef855705fe45c97c6f167a28fbcb69e53fffda0008010211013f10e0f1a13891270fb98989707c9a2221084261c67dea131084bb32739fe16b20c3c13f367e89d45626f8f6763a5656563628a284e595bc795f205297294a5294bf2df816343c1621902bf00040d18da1a1052082482a18dfc0be4ec4b5f2a4e17171687869d0f589c2851420d1381784735e135e21e4f8e94bc174bc90d0d089c5a10783f2c4cfd4a5def2323231a6767676764647abfc37e29896e971e3d9ad0d0c7e78b50a487a5294ba5628a2f806ee2c7fe984629329328f8c26b43ce4405d126572973a1b2e745cb9760d109f04e5191ec23cecb33b8887425c2fc0f18f113cff002c4cfd46e97294a8a368a53ff709f0362f05ca1084c825909a82095978321794c6863d758d347ec377cc65e544af82fd097098cba262b1726282fe0ff81657fc9ff241515625f0489733cf319358c6e26c87f435c24c688f0d35919d9fa67fc1d8a25f653b0de511d61329689ac49108888888411395b3b1393ec8344e2ffc05e699761393e761082441226de0909a1b435f1cc98c6370992420d9049234654545441514bf341739908228b2fc539be66b052780a0b8f210b94acacd28d9427ccb3c213170935739ce717c0b97a589c28fbc5c6095e0b63d988ec8c5d70ec548cecec61446565fdd104898be17c18f49f0831b993e0bbe05fc1764d5b6ea26c12d5a378d8944123bf9df02e5d9f3822897114e8b9a1090b509705b4be0c4ac50217cd318f4b989f050863c5f7c8b662e2b8258c997ed09084d9f331e962c98df00a8863637c05e1382425f02c4b17437918a4d9b7e4631fc03e71941298dc184c4a9274128f80a1082104b0b86ac3b88fea24fc16518823e6b18fe13d704d1298e06bac4a35b993443b0820b624421082108244210842719f031e1fc07ae24129901f7c17592fd9df482eb50412121685110253f23f51764104ae21079312e538bf8c3d73299e630ff00b186c231e01277c068a208a5c5945177d4161f6b4253f59422107d13f0cd7ac3c5ab822253ef12a2a120bf1c67311d8f0c58cbd435c9747818af57107906848b8293693e064175727b096172025384f844c68f1a1ef0f7e052377838e9d8fe3421381884e3e46b5a0426417c9e36719313f969595f1842737932f173890b171b9472409197570f078703d21ff9610835c26da121652e66b95ec4b83823830f351858ae27bef2465ebf9e0b1fc4f0c48431b27e0ddf71c1e784b36e36379754676d17209e1aff00342139be53dc0a04d9e0d8cbc2e2c96e27c4fb634825f627fa20e2e0f966adb6e23b8fbe1c90f47c506f50b258216fee6e188262ff0014e106b60c4eb16b54fac7dbf478879c6c7b8f1ebec7c13c4cfac610b90486e146b10fe45f0c1a1e35c27f046c3186f5ecd5891d0a62e5cc2f47d0635886bfc51707abccce80b1b84d64e090b44c4c89f3647967947d71e2ff001a43e0f6dc5b2a1e2d1b1438f471c2820a10c71a242e86baf8686fd3c2e035fe87f0cf1718fa1b5f6354489c5ad59528453a27aff58b892c78e21a98fe25909cdf03cc5ca51f19272944f135a12b88228904e890d1d185c410f8058e8931fc2b93e0c9c05c58dd860cec30d84c2d082e265105043f56488d8c278fc891e31f5e23b1e7f927c43c1e82e9b0d8b1b53c31f00a32b8a0a0b0809d5e10963c8ba3f45e871fa7fa54b93d0bd3e8a30cd3163e35884f10df124651467ed9e07e87e8f03ff8613e7eebf41886342dc421b835210835c52104ec43f05b12c97a478c79c820823ca2c6f8dcb0a18af1fe292e2fd062d56ac18786d23a7e0e382105e0847810ece23d899791e32f03767a235d90f44f046924f1d60fd8b2ab0d6a84cf89f0618b1977c33ecfb1b174df62bf5e48fd962f5b0484c4859d5e814c61d48f195a85fd891061d93ef82264bb45a3d09fcb385087c1e2df70f4e883131f64c42122090847d1dcf41ee7a8f0c0df30c8c740c84c23dcd87a45941285d9f220b1f0f03f4f05e08358bad8d8b81312e087e0d42e87dc4be9a15d02a7414f11d040f221f42fa2e1d9589d2c9aa858cbc21084e4cf0f17a52f0f23437b34242631ea0441ac5a9899f435624498518181c71f807813a3c1f6e4d6a8b0c682f918fd0c42e3e06c6362097064d154216937cd4bd0ff0081c2c107e82e1fbc0dd645c350b45f6114acab8d38421383d41c62ceb90fa638c6b851bc4d224a3132f04c4c4ec94eb891e7404e1c370510a23627cc3e37af58e31727107d8d0f46379d0a37f0a62789e68f82c3546790b3e82104e1f2c44d7454789be88fd238cfc2f1e33df131b98f68794a0f18dfca843b5c28f0ed904840b1b032214058332606e86e882e468684e20fe283c67ac4f831a1fbef19091ee31a20d622627c04c2604c8587a821d81704bfc27b14a15b3d8b222f6107f708ec774e08f0ff00d0d909b083c7c1eb170834760d63de0d10687884cb719e716cdd4936052e9145a08253492c435997a62cdfb1cf65de2f8de1bbc48f35f09a121eabb208344265c7ccd92ac0f54fad8c57d894209da610c5d6761a52eb0c3d83ea1c997fa2f8e7318967a706328d563420f265e484f1383ae8fe815b05a21785c6411ef2c2080c4fe8c74e867ed7a7eec82f81f0683c5adf30d643af441a18faca79c6e210b82132b2858a099d88343d3d172baae59c0104be06b58d1623de08f0377c1973abc631ae37821637436bcd804ebd09de897e0a84513164d040bfb3a6093ec33a05fa21f0b2631fe07e87eeb7944cc6aecbc05297e14cbd8827ef00a404ba17e02656bd09fb13bec4afc145934985750bc888f93c0d32ec1678e24cfc2de91687a3e772e5e86ca263da8bd1fd61ee06a10ee32bf213eec42fd06bd123f05e109f29f17268171be0fdc587da3146b82297514a3c63ff0004ac4430cfa71dd5d06cbd1708883f9123c085305fc8c13fbf1cc37c0ddc6f83f514623a0dd28ca3f9c7384f50842ccba36ff801a9c93ca4a411f2793e9c4b114f498f75e745c63637c09cd6b9af814b1624263746e64c7899d0ff00b476eba0d35ee2652e294a5f97ef16512ca37c9f10c63631eccf0bc126fa4581091625490a51b1e76506771ad3760bc1a9c697e098d6b1eb16258c6f20f83a3c4cb878c689be896b0e8f63171080c2636528bd2027b7f4623ec871133cdbc92e4f1eb108a365c486e712777169fc29bc1ea08ea8f0b89d1388a146c6ca53b31e111336791e0f4521eff3e6b8f3ef898d890fa4370441c13918c4cfc1da3d630d94b862946f178151fb90184bd28fedc96bc7f31f214625e651325da20d61ea45664bb63ccd5ca3796171b1bd4583770fd0c3ccda242663bfe727c4d8f1eb0ca23d12983e48f4a8c3ae10912a12994b8d886c4ee362c6e08bc4ff0001efb6282c105d89ea2aa1078b5651c77a72886f5260f93d4513c4ca5d2946c786f13185d946f8a16884f0f39223cc84c7f4c3ec42b4386ad43cf21783cae05e9f43f93ef5ea18fcc7cdf9f096bc1275f07fffc4002b120002010303030403010101010100000000011121314110516171819120a1b1f0c1d1e1f130405060ffda0008010102013f10f4324820818c810417981310c7a0ab9c0989fa1456e35ad862c7a46b4928821e9f5e99c34721d652242425a412741d1a1091bd504695bb91e90038a7a0c62f3a6704baf1a5850255a1a9110121291d885b4486c47632909a89ec5b83582a50e634531356cab31aff000120488193548122eda56b8155dbfe121c0e96475d0495848f26710f7884a924211ac06636f107004b44da51322ca837837327564f7f44104693a3440d0d6826e436e1a6ae208263e09b942aa4c5a40d0848686bcd8341090b5485a24242f411a493a2d04c6244c496d63494435281a13a586bb6855d8f92347aaea86bd910515889c2bfc89bd12249234544c624613a2091608804568524bbe10b49448c927430de86274444c9192489eaf5fa15247227b9d64c96e4b727b8df71830dff00c1e8f5640c342fa863c3244187d722a89a922206865498911dc8ee26492c993426132244ce63909898989c988a72626c4cdda217dceb1a1916204771f221b8bdceb20351276d3234431a343d131fb93131224d3e015213122653bd29b9c4710f1b213b292560d4506f9ea22265fcdc7126ebdecba0ca165c5472c7c8765a28c90bf64bb2de1b2cc1781c761bb1ee717b8f68e238c9ac8e22ce07a7dc47b9c4bc92e129f81f890b6842c650d90f570ffd2b464e343d8d3e34434b85c0e584a85212fc0b21c3625826710dce219b0dd878bfe0f581a2354d055e374a6218d28c21760b5812b0c7f0e631b0ecbd43912244c993d896c2325b09b6127b1512624f627612db4a109d088d1a21b9d43e6337d754d451910249ad6804d05ee27720404a25d08a1da9b48ca631e717726ec5bc37dd2639b11f81049507cd528dd94a7c2ec8ee338f5dcef1b22be2eeef24084d2f62010dc69b897723a117a13b568d85c111208b225d238842a4351891950ac250f944be37135a2ca944753d1b867786b26f1e092c7f0ceba2e26e4f51cec3516630a17bbf44fa2082081e8d68d0c30841932197689091af5b0bb5ea90d0858686b4d9ee56abe88d6749d2349d098a3461a13a9e92493a24813ab8c312090b7a9021aa5d447228ba27e8488234986b582352640bd09212d4d55d67b93ab1309892489ee361aac3724492dc829236dc4e4c909c989c98dd8ca509d88b097a290d2e43ff004688d23581865760f78684c64cb0e653137d3d08c61205b43411793a89b243512264c989c9931389c42844e96e2c853a68a155ad5393948f923b889823b89899375c09559434dd19712b6b6d10d61026c44b4651186555ff000333a12148e5d3a742655a324a092827dd65d46b522764e7606c9bf65bc21cc2d8254ec3f349c6e718836abee10ccb48813cb01255abcbe0b65d7dcee57dc369275296916d8f6bf8219586f8d24d6d532d91ede9a64a423aa1b7c87b272859431b2a93484fb338869937bee389ff0007f0ce2360caf10d98e63e486c6529a55e2abb8f69922921b2ba2f21fa2081a20823d0d1035ac104082af1f6d5131a6466434629d53d608130de071167b0fea7522652484d3313893d88643d88625c0990468f44c9208d1d8ea184a39944c6b4a85c180579dc6ee29d2948b4529c90dc5c8a9225dc46e34b710ace04e540705a9a02d743f2f7256e87a0ab7c8aac9055085868eb12addf6e3194dde5a9a4904e27437f761e8d37adf0d904b6143ec92edee35d86da4925b9464a50edee2eda5eec8ce91bff000427d6a4985ccfc884bf8267297681743fe118ef85024aff0051e546bf3a656df7938450685fbcf5288e3ccb76c5a892eb766f2afcf72b373dec4ea411e8487eb37a34411a31a1a1e8f3ad150368fe81368c2204a8b4864f710a6969249249249289104f4444fa0504d7a2082c491a4690410256dbf2249d34aa35c69ad524924924b27b92264896898b7bf8490489ee4b727bb24b27312e49133985b87313dc62b325be94b71af2349e836d8de0c693264992131839d0a9215c519150539192493c0a8a887e95ff00290c81ad6082068685a38b8dbd1260648f6942a9a1fb318918d0cc3b2a86aa3a130825e873d28ad4515a54825121113422489813de726ae9b129a1ce337b827712d538640c84233537c87b2895ba146e57662e64f7432e98a7944b7437b98b2295776f040c0d56dfe8e32383f629ea489ab717ac6acab7b8f8f846678cbfb258a72daec63c5ac3f7436e686292b182ce9682098eab6fc9b703e2279694ed92d44a6d371908ac7a58820498d5e704e2834b0a969321d5f02a4a643de345e86cdb6d2dff00c9fa19041034342af1f668a221898e82a909b07a410259b54626618b285ff07b4114105a6b4a0488208d208d47a57a064321d9903c23e50ee10ad8f89119219c89b13133a8ebf939042f56edfbe82d8ddd9e1592162744fc8a79fe135cf910949912fc98d5e3eb939b21404ac9dc9cad8ad571c92af392d34e6c3ab06d55dd93aa86d2efc8c6e2435e43f7636e6ff6376a2682e2cdc316e325a242aa446925067e61cc4ef13de365557bf664397b94208781268aff0002cb2c36506d4ad4abf622c34162893ab703368ebc3e4cbc6a7f291d94902d245a411ff17e968640d0d0b74647543518242f8098f36875f4cabd0ae076122381bf5bd14c2726271393c8b4a2358d259248c1b1b410a492a98484b420d0f511040c925db442f436a18d91af4124b7e467942af41094946aa5be0767b8f2bc4753784cafec9703c0fb630b06a295452efc1530858de391a9a29eca05adc16fea6469a12ba10621226497544fc926a989e8dc544549c8c48ddce5136489e18e571a9010ce7312fe90b912aa7fb2a922afa569035ff18190411a41040d103426b5463e86b482e34d87b48ba0227420c22e6a3310c09952592ca9226d1ebd29c90d3712264c98989ec6f23a496da5f01bec371e482347a8390cdc6ee30e13a220c6b7cf03725d859106142d46de7a92b74b8b7a5b6d2eed8a45726c2c256a591db2b0fdba40bb3fe12197d8385826334eb858ea4a6896dfb2b21a5450532b48d6906e9362c4cde3721cb42556a7ec86ba7f8092ad437047e23787ec26d3fb06bc91045019f011d8810d85e22d09a5b4129b69df6b205d5ef49c3a2eb1a30ed7583206fc22a0ff00c11cafcb1bb046e53fd434694b7ec4d2c99ffc63fe3041046b040d103420bbc6f49031c5e83d927616947a411a0975547e07710a8823d102441046a99249249249249242d04908c0842534d13a4d1d896fa7064391bb93263a2a3714eee0859285aab6a4aaa3857424e865a1882827ca5052c085b0a36216889bcb4cf60ae32109a4dcbfaf4a3d64b73ab43ada517909cb75bc406fa7e08711a3ba7e4df3174e0b42bda1ccdd0ecb274823d7041047a6758d606a068640d0d0a772272b4266f8c3dee2dd997d1ad05f596a92167097662993d25a0709c6711c2711c0c8d8c5c190f6624dee34d12c46c73b12f6d11d2f238130d92506b4c9d234208911382351c25f22668485f2c4aeea2630a4fb0ca8535c7e609ba8f1b25b95244b8ff0596471dfbbf7169d6c42952738d1ac323c5b78e45aa5a4ce234b3096418d62ea484fb142ad3f64f624ae89ecc6a52d4103712572c913613eef1d4a11a50891217329b56fb76252669aab6874b9d2cbf6e7d1b1f516ea89b970f2f620aa6277bfb97756251f18945294325a6d217fd2347e882358208106881e863144e887a12c51b331790a56191a1490c6bcd86eb1193dc9ee34989ce91701701288114f8d35b04f8363e07445c64f03a487c671cbb285f04b40c4951a1b1ae0db237921da94dc869b522e25ec73fb8cd0a68def61b6a4aee69bf4251b5daf025b952eac4e9c25ec744bf232a8baa5781198fc0847f8c1237ee566dd6eee6a5ec95ab557a41fe24f03070e9be04ea524fad854cca32ddc2b475131b4fba30427eb4d26ee4a722949bc325de5ad92fac13a13c33351ef7c8f2495133332d3dd15f2edd6058dd7616723b845d8fbd0a4a5ab9ad8405ed691f45330fe0354b7f03097072d8d4aea6dedfb38ab145309e11b157563c4fbc90aa3f61157a57381e45b5b1bdcc646e2830d9b29e44a9f80fdde06bbb1ba49e97e89d11244d07ff240c7a3420c638e9d12ec4a24e68a4dc18b2762d0c9d20948584da2627136c27111c4ce316c9c473866a91c2ce60b7a734e68b7a73b4a932d239c3ce0fd9ca886387a230e4c60bccc1362ca4a7ab420c73076fd085258de7fc0492ed90db935182492e5f98c0ce309cb42fd90ce1a99d8da91412243a245aa302ab1d10d3591f29ae8107599bc49b9b06a46b89ab93a5a901e2492dcea25bb3a993c9259675325bb1b6ec96ec96e4bdcee3e436f714c89d1f8851aeb6253e933a413ea9ff95b1aa068620c685a8612c19591f31944fa3a0c36dc956a422558946ab3a89a1d189eac5e2b8d687c6e87d24908d5848242026884c45026861e5d480ce7827302ec4a447823b9b5c0e1682d9943e2c7308c49174924a1365104f15a17c54940d2d86772c9fb211a2aa36b213e886d0a8a17b3380579aca2c364dad85483ce13ec2ec9dd94697b06624df613c7b28ca6f4b7757d7a95a68fcd50cd56d097b8a28e7c90a76d93f8f0dc9775e8a17e97991fb2fcc15848c2266ca73bccb1455ee9a95ebc294bcb29d3f00d4a7e45fbf650ce0f02ae7d1844884a5ca972355d9c38a7c994efb524bd9fdee24659c12813b6f7f073bc245079d4447f646d0e61f2db095bbd5c0b7f52ec3172a0a65a5ed57f085661f7a3e4c263aa65d23c96928aaaa26f41b9207c108485ff00a8b47a1e85a31abaa63207985ab80e7717ba2726a8d783609e95fd087939f7109298c49404c4c9d2b7e49326231041217220412246d89c60d8725486365b8dbc0b663f9f0366ebc9f8c1e1725bec222d88d15915594975362eaa60f7bb4c1d119c3f449892237097320706c9de2706c9dece56728bb31cbf236643544daf612bf748dd46ccdbf21466d1d5a1eb2912b2307e05dd9fc0b789a92737e48b2bc0f7d1bcd7839fd862e75a5c487c45485074ce145fb547bfd63b165c0d39844a1a817a24ef5a0c9ac9d58cb9204a59214d09ae9c5dbbff00c20820823d11ac6891040d11a3f503912c37ec3829a4fcfbeaae4103d0dd93f06cd4ee2981f131c92d029294d04af4142c69f91e7125a1b8809211146110a8642d024b6380d92106fd7f4404383005359300f1efc47cb04a97b56d29e591a4bc20a6f8c2878489b5a3f64e845bb69e497c8e7222cbc2d173fb314dd52fd8e22cd021c6e55f263da16d09c30d7e88b454cb0ca5b6b637dd8f3b7d5d5c0844323c9343bb91e36aa44b482649b6f0437665ef25e17dd099d90dab51bd358988870b1ab551762ebe51b1cb1a371dc0cfd9722c9865c3c75d872baaf4764d11df49192442ac84a4d0af471b976f6acbe086dcfb04cea9df71b0936a12f73f9ec4c37615a1ee3e2f273ddd21e65e5a0772159b3efb0d3c2d65b7257dfb31811342b688e7135ac7ae3d51a2206842081a208208d0d0a31e137d49bfa2284105357909b6a510f53d99789110147a0a64721cace73986b8b4336436012c0ff5c27ca0becc5b9f22ff0028cbf6cca4bda4c8f98d983ee4c4d2ba49392d0dd6c72f0557983f867b8b78613489bf4a3e4d8f1bf634aebed91695a60d10e1441248f1a5137855226daec0d6e29aa97bd2b4c59564f7d6fa5ad205a0306db09b6138984e4ca8db4a04f92749e75688d3302111b6dd0919e89e090c3de741d0bf4336474ce8bace29ee60133cd35fc3b0647bda5dbdc64a12776bd9b761ee6a34891547850319f0295df5f3766421ff00d110323462f4bd5fa140fe842542081862ad6de8f38b91cb0c8204bd724e93e89249d249d244f48f421123b6824243ad65ed5dcb7f98fe44afe3fa17f33f412fec7b0be83f02b9faafe0dc7d3a8979bbd7e4ff000cfc8fae09bbb1ce0920294b6d1b43c88229b5ac6bb2c9194b4d2c2aef5293a3ce6b1757d4d34b4915a8cc13ff003af921bbf344f661b89bf8e1ccb4b72bf2adde59bf916ca1c2f5fd635d1aef7424bc0e1c96665754a5432c3a23dd0ce1eb0fc1fefb891a85d843e5101bbd05e2a51dbfa5c5941d09ee269553d96fc2928a573c3f626949f87d0ee410b42448ac09b7366d6321346ba7e84d3ca1e43684954988293c2b1f875627233e66aebec1508cf60f6c04caa42a246b1026a2b196ba0754628dbeae747ff08206868813f42043d18fd2f4b2f7a16a47a2326df824ba46bd2b45ff0075ff0008208f54e924924e898993ac8992493a27d1264fd127d1399e58916f2848afdaea24fed91dbcf1f2ae12e6dfb90fcb46fe04bb378fd0eafb0e6bb4dc5e0d7e4843d943878ec2fab9244eef71c4a0ac499516ca0db3de4e34561bb26229c66c4b914096e8926eec5b35225a8b49d2082082082082348d191a410413a411ab18e31fd14ae91a40d21acbc8bfb4213c38219bfa5102d52204244693a46b047a6082348208f5493aa5a4ff00c649f447a5691eb6c5727582358208f40e83a04520f869047aa08208208235afa17a1e8c7a59617a2e208d60ef6fc0f222a42e0adc799cf345633c07f0e6e6841688299d6759d47593dc96fe88388e2380e03899c4c9ecc96cc9ecfd02082082355e89d502ff0082d204881ad12208f446b3abf43122082348204410411a40911a208d208d60820820823482355e868818f563d47aa5e851102440d694733d25228e367ca372404597eab547bb6bb37e497b8f9454334129226d9e1f03a1ed299986362ec16bdb6325cbb95218948911344c1284e3847223ee673832539d66e1e07b8f04b7783abe0ea7813b1c230614790b45a34422a5bfadb2c1a5f947418b3a030993d8e2388e0264c9ec4b6380e2671325b1d04690469041041047a5977a608208208208d1046882345e85a2447aa081af4469031eac7a8de960484b4635a45037c313d3482baec47d0f6146aafa2652e53c14470e8daf517e44810c39b4991a40e154214d3d8442212428140ba8b64f6f82622711c471a1ed86c0922932f7a0d717a10b121e5e0ddbd85e57be76e11179d6db9e12d86a535b6e52abd941887c3fc0dd95dc1e0ef2bfc9b3f4ee3c44d86f76bf050fb7c1f6ff0007f81144b6741bc08e73be9c9449f96fc9f5ff0063ecfec355fc09fe48efe78d17f27f434dfcdfd1fd786eb17710dbd88ede8223b0f908efa5ea49313184c99c6218380e227b13d89ec4f6f4991ac11aad2348d20823482082081687ab1e963fa09512d60821df1eda41041cb5f2144ba3b8bd85ed0f815039ac47294fc13b52276e1ba646c5a20091226539fe8e471684d49112a09b625b12d89ec4f61eceeaf5d96ef81dc2a5d46f7e5c608234820b474a32a3f2f83f3341bb65926ff1b69242659911d112ec2e2256ac2f286931223b10d87c0667d132426264872c2f0887f0437feb0feb5f0377eb0ee3c61b30746fe071fe9c9c6fa723fbafc970ebb64f72dc199baf7aa4c201ee37216f06ef1b848caafb507f9686efd21a7dbf65ec7cbf636a0544a8ab74ec8782609ecc7566b2654d5293e951a92d4e682a66cdf04322410410411aad634688208f446a48635ea1631bd05b8846881a292ff673241041022bee3a49f94ac5c0c6951bb4f15254c6f22bc8b61fb9b51216854c55e51783f0c9d4b1ae26262647a10f4d84f2db2e49cec9d92ddeef9f4409195613ecb915d44be5bb7914b1035d849b23a4ae696ed24707491d909761242116126c47636111d86940a1e823d161e9486b75fa0b024cbc2a1b26edd4f2d03f705325ed10a6ac8b83dee99e224ddd8266add80749cbd9d878a0e4437dc68ba9a1dbe84a7dce82f88eeca4a08ba2a99ad8cc8bdf1e0522b3095db28ad8b664728de03d20460951edc1fe786ff427e3d51a4ffc2082081a20820637a3d09a586afd097128409104cb520d9abe46ea1b54b082081212c0f73a88baca6c8a56e54d0d0f42ca4b6269fed6e396188d38625945b2a7cb7ea231210ab4db16318c27a10dd5509d2e6dadddfc2dc4e8f81d92244c8d121e75b5b87f209d6aa84a113e77491b44493aa64e8489923640b540e5524614b725952a36c964b25921b12264c993263464ca4acf747f27e7841acfd40da468ba1cc3a06acb4a71cd1eafb652321ed58f616b315d2d6f27d645d0a7ddb21402de61b8f1d0b619e5dd6c5e6bac95e927b7cb27fec47aa06b4913ff008bf441031fa4bdf3f4d04208254c2574ca7c316d9c3ad5a3d88208d1327afc33187806539f6d23481a1e94952a95835c2d69cacb81f74390f19e828969184f5393223df53d05ee3dfb011b2585c11a2d207450f059fa17c9112494512508b8139a5cbcbac324a92c4f84c64585c49ec4b62593d897a997a9495a82b8248d6492492493a4e93a4e83a0e93a48ec4652828e338b71bea6d4b74d868e6b2ba4352cde24a5a5312602b8d056c52d9f476c39090db24865c6cb5f3a2995a514cbe048b0bec8a22157a7e4cab016daf2914271b65153a2171f938979d63d29a49227ac1036488635e86bd62f74fd0a2904104690410243fa41757410973f2afee268841035a190468d156746d6d21da65f2192933773b0c2099331582e977e5c0d0f750dbbc8fd08a25c2cf7ebb3a110599ae908486a7897f0c9b6f8f9189a41045048812d244c4c920822f7e808208d10411a90886e43721b8f463b889d81a53d85681f8c99e584d1cc4f71b328f418dd74c9005a07acecfadc5f71142216aa13100eafdc8d4226249545c19cf510ca9458e4eb27b8b711182f9a94b8dfa9ca8e71ad12246c486c9d2745e9818b58d5a18d7a4aff007f42504090fd11e855bb473bd04b55bb01d6a4aae9041047a206b51cee4526895cc0d8b5759c90a85af817592fa82b9b3d6f437f80db66db96eeeee776492468f649296fbb91705a7d4ae6f7f810d1219e3c7e220d0e04705dec4e1f8d090911a2441041040910243c296e064b7b89413a2208f4c12208208d13184f616dbf8eee6f4639523f50b062a12973e44f0d741f750eecdba0f5f861cdbb9f029b0a5a132fbb215ad57cf61092b046e7f03ce1cefc0f4e2e36cdee30f4f4a9054816f1f48d1a208d1046a8d1124e8bd3020f463f50daaf4208a19b412234823440f64a4749afc98568b7565fb10b6bbf91a82748208208208208208d28aa3dcb58f818dc26ff00725fb13275432b5925562ea7dd70ae7913b9c83a9af0105afc0fb4644b448bd09fa13d24a02b0ea86c8962646952592ca952a54a92c964b2592c6d8f785340d47aa36354979c029ae88edbab6994c68ed9d3879741a4f8a16e3fbed663ab8d5836bee75d0a3ee44aa281d24328b058e96c7c0a4a9e461be11c4701c22204208d23d10468da16b0411a3d1a1a1fa4af0f442d342511046882081222a220f021c40c2c009eead5d89abac8820d1041020bd3040d0889b64957a129b5adf66ff82f433db4ca376f0b93eff3e05f236b72170740852ae9a2c4357a1f24b3eb3e8482081a16924eae05b0ed8e9196c2422446a4480908ec2e27491d8e91701a10d26505d511d9fe23f075e3e883e646d920f86e48a6cbb1b00daad3fe00c4af48e67f8085421c2be1d0552543a23e133593d95e35ae4daa3c94c249a3eb3a2f0a91842513a1a20820820820488f541034411a1fa4bde3235bce589a204b441040840b5b9240d5e56208d4bbb2348d5ad2346b4486881e9b90f07f56393f4a2a65d846ed909598a7b9fae340a8e5d85a4b5f02d17444c35d57c961cbbf6d2924924927d2891a42ac68858212d24a0d084412910d251420421a101a435a4464ff008042b8d25012540a0bed281aa7f448fbb720a89e78e99db916aec972a91a24fd620e1bbc88944d4754758b80b791ef31bea5a1cecfc546faa5b378a91dd5791ffb07fbf0208820a462744848688207a2208f532041fa4ae77f47b81721212ae90311a204895d73f812c9590d504492449046881ad521a1d1f097cecb763fad0e8f57bb1e904104668af6385bbe082bcede59c72550efb5a3619e89bcb256e421d491bba11a3a7c8b5d65979bf3e989d112493a364e849a16a6040810207308c320731c9aedca4ef1bde324eccdd8bc0b48cc2e1dd7248e25742e0b913be8843675bf52bcd52861ce18962b244a092885427e3beff24392ebabe4f86410e1e4b6be5ee429616faadedf05f7e2f638ddc68930f942f753f2c4c5a40f48d0831068688204b58f4c1020fd0107abefaa6352f72e1212a468d7a0342477b2b24322a46f41a430d090c81a2082098fd0bb67e9a897ef9f44090febaba29bafd8a0c5a78fa771f432bf0b8296dfa2f5569ba0fe0d816344c49e82e72bd0c91731c0ce262de1c439273bf06ed9cece57e0e5673327cb3fc77aa1c5f738471fdce3fb9c7f738671f586ff00707fdcd2ff00d33fd33fd33fa31ff64ff5c3dafb98731304b6e4be1145597b19b8760eda5b64a5e131b2eaf9abf73a03d64314743371f80794172bcb7198724d59b1b33f644f45ac082d234634410410411a4fa247d46d2d47dcbf5485a4886fb08409103d06848e24619acb9d26a88b0d49102704684d18842baaf51eaf643eba5bf11b258f4a0d82e298b1fea84292a7054490f6773f76706864431d1931309b73bc9f2c78613b97ca8c262d4927527aacb299c1346f8263443722247bc720afcc699ef9ca3df1ef8cdce446a3763d0207bb1225b9782e1fc242469021046888d67568485a224812244f463d104d67d1086882461fa0def41104e11976144881220810411084532e44965450eba249a8cfe0686141e85a6aa53c4c737fa1f5ec87723d0e684a7dd94df557fd08dfe31c6861581150a050f544e745a7dc9c3d62e8ad081023e8ab9ce53907bda4e425d1aca27f546c635c323a96619989ef25d91b856f712b2c48d2cf48da2de8c49a1a9d12d84c4b625b12d89eda7a082351888129d104091231213246c6c488a99041046bd8435a247e80fe063d5606e9f23708a634a1020d104091043212aa1a9a7d0354d2f1a68c76156c208264d5515e4fb2e463ab72df99f4a025d825572466c05ff6be4c688d0d0c7df9d34452c9ab0d24d7fa12264c750ccaf09a1db0b8095e08ac323b1d619ee88723cded64dfecc2657a6784d8de05b329ee3774219639cc4f0285853a4b218c7b93d8931aeadc27b8db71a6e224e168c09b8c22a2a96c9e469d16aa9d124a831089686cb2c3420877196c8751610823432a23d289d62d192081a12d249106b4209a1b46745fb1925cf64c2db4a0909ada16885cc4fe438c15fd05729b2b112450866ac42d6225094b844272c57a46e5d6d3a9d570e491fa17d8b242f55155853844ba35a197a65255152888f0524be244ff0068847fa83d0cbcde9caf6633b458c769c8919c834cb3d8df6c25e4fa895bc48492c0c489626c4f16d0b6b4b20412c8ac0876425d8e28e117116a53b703ae9c7813427ea6e8c3d090862f5da3a95a65e8a5949936efd8b52c40f4812d0d11a41040d1026490c6b492c4ca881a0a5914a90e48132240d09a8baa31e8929d5095845cc484848484d0d13a511d8ccbb0d4db9212b0d11155a24d2a68489c9d125cb36dadec7fa2e347e84c455fc0b3492373a21e657b01d1e2bd98954dd84755a4e16613b94989b77727cfb92184d72253a25fe69be24f54354c8c4b65480578a5449752995428be93c1bf6275b0c1489721731c1a05bc29e44526618085b424d853c23a74209448993084ad112a309f3f81e580d63e5fe0b8ae917c0c3e7493dd97e87550f5fc97f0861283294cc4c4d5726da6d8c9385f22e98263a24a112bc0a8d173c0db33733b39d13c4e01fa2ebf4f2a0498425b6886bd0e0431d89d1a1210a8bf450655e44892041bd257747a4786d2506e281c422082342310c14efd34b5d7512454d0a14ffa38a18d3fa3bc977d5ddcff00423d0c9faf71cdd84b77c11aa0b50bac6f6d880afbd978dcb91a5ee2f091dda844a77a92516cb2766c06b9e135c5c24bace851dd2ec154ce03ac26ea8b50b619a4955594a6a87cd3ce1568ef7583bb3a6b12a9bf0849e30a45aac3c24252926aaa44cc0a6cd5eb2873d4a07d12fec494fec89e8ac2704ac0b8e8d5823468ce08b126c305b2f61463545f80bf7f8140a3ba255d37e7e0f67667e0b679697b8e58b95a6ce4684ce058ab590c5dd663f6503d2be4bf22573b7c8d9706f897ce66fc05367507c96c7d9f2184a9f7a9f02684925e17a79435df1ee215aa5e4406ad7f604a18de06e577c96290e96f8fc114f6eaec39dac7c8862d3758443a8d0eb36e9d065914fb9197b50e3bf723f42208ce551395302bc891041040cb79206869b281beec5542344a4824822c8d0d54d6f5d291ca47aada11a253d1fc0ff5e8648d22c2206813a085a3b7c13a4dd104d2fb225532fab2a1ac229b5f2dec96e4f9d0b36eaf77e85a4ad65fe85cb16fe38b756d8aa9d384cba503265d969a8f427815887f82fdf964b85bbfd91422dc193afb1045a1909a2e8a3663c8ade7fa5b06a1cb70acb2c122d152a1ae50dd38438755cad9aa388eb411b0a76ac3a1d27f23ca10adaa309ab3f824e89514b96bb276112411c43559431d432ff02d2a4763213556bd52245925e7e6556290ca18decd95e04f1fb8fd13b7c55896aaec9fe4385f43b0a794b96dc7c15a4d834aa8573db5d8dd41485537675495626ec79a4abe59781a2e1a87c8dc791d9a9e4aa9e07b5f81ec1fca675f81b65815f5d8f6bc45f04104362ad45c59a4aa63ad4f8547e6ff00f67437e06baef7f22504a825a6534790a373f323b698ec28c69469ba17e496dc95bf126fc707d2389e10a727421a91b4a4f7a9f02d85fcbbf051db4abad512d2ad0aefd58bd2129c1ceecd1b849a24209094091046c268d0d11825d08116aafb1046b236b4a921e48a6a41dc350813ac0da29173e86857c88fc1178d0e220e444092a47aa48a21c284f49a8ea1da8745246491b4bee38d46a85d0242b92ba5bb7778e391f99f01b2fd93afcba64aabaf16a8fc90adace835c2dda25ac8138df76f715e33098a8d82e201cbde6af6310b69fcce442aaa32ee27f822ddff00302655ddd8cb5d0daa7a206ba2a1f22ce237955aeba198a71e570f3223e3437b0504a12ddcd5d14d9022a755c1d5369df94526a8bc42206499d5df96adc3a0b5cf772be955425495478714847b434d48a25c970f7135ec1de888116b7287ee3f2217b0d1687b37539a3a432e7ecdbb277cff00427d52d0dafd094693767927fea88651f5ae46facddb7ef60cd34418597492672ab86470be23029f68ec6ffa0e82e61a7c22c3d53c42ef0d3e0aad5ad1dba1521a9ab1364ddbb0dba9e76440bf79d13131c6a46a2838930f58122e8bc9035a12344095aa229414a83b4ac5d0902546e4a4b61eb24b61040998191658d0d18340d6a3fdb14621ca7ababf92259c9dda15548941b2cf98ec60ff0042610d139f6584961123693f725b92d93037e957288d911a91dce3f65525f8391f34212b3618d5dbf2379fae5d70abf4ae0a803565892f59f3a65cacd4150efa09be19e93ba0a91818a73c75018970994716a3fd413657cd8f1c3d9c3179d020ec7e55090249caeb47b0ea3b8ecaa44cb1fbdfe499f19fc852f285452851e53927b7bf6154a1473c7e8dfd43434571dcd2e1367e7fecd1213f29ee9ee3070da17b261fb13a6b376d945d445349efaa495df22dababbb6ddbf5c78ad266137b93eda66ef4741365c17711df891bff00d392edda862f1c42e9ac3d121a1a124282474e44c7512381b129d0ca618a07a216355a1a1a1a19b8adbcbcc8f9374e7ac8d11a5670c41062c571089d182d754320568cf45511d362546258ecf224b2f07ef0797cec1a9ea8751c8d915d98d1cda1b264fa50cdf64ddcf7116147791546913424d0575d7911bc90d48a9e7e04dcccff00a7181bef8f76249be3f064403d59fd604bdcbee3579d59ecab8aa8e5d07c3ea24b01f292a98567c83ab0aacc9b3221752d84b2e509cdc64f96b751b5ec952c26598bfe2a25ed0423b8d489dd71443760dca3a35bae46edd12fcd1f2114fe96c123cd256cb5534f0c4aafdbd6fb7cfd468630fc25df724a0ad5a3958ae7fecb569a4d3baba68c88ed5d98ff001cb7ee43ca53592b97ff000b866c1195d97456b15da999a0bf54fa488bf8a1f0f915edf27a246eba11770c2c93546acf220692b0aeff00dd10409b90435643bfbb92c4c892248608813154686853d16b6d0d0dc8c4c62cd14b02ba12b3d17edbda7f47448998d092c582d028d08e5c101761e1b70bd92a8317142cad47913b48457712dfe0359b6db6eedd5b7bb791b23267a1222473ea48446cf9138b7204c90a7dcc4427dd5946c0da8ba8dfe50c8f0489808e7edc7994353262a86725de7625d1ee2e39a2dc15f974328152d89b74316a86ec8ae2e0f93d2cda749ca88e05dd184bf50da7f010cccbba73b34ec2660662cce48b54c8bd5860ec6bdba0d6a18ff0ef21f71502d11ebe2aba3a30b138e8395f5f818ce437a706fa0baa7366249e465559ca69e1d0ba80f6d51cecefea431129cc9f0b85e5aef6f04337b1d5ff0078ff008446b74d7928d66eaabc8f523a651c26e77e848511da82b4d11599dda9f625cd33797451f8234999434a6d4f2349a3e5f8144776ede97d1d0463434460a10910731af04124bea452a86842bc6881b0310902d4410536c7aa2528bafc53f02d04899245168126c354d0fe614d7a955cb5fb2a04dc744a16c488ad039d85fe9ce292ccb76dd912310e749bd53a5da294b72106add1782a959caf6b0f41ae1a08935f6a51823ca2bb14af27e41c5ca365f151b939b105aca5d484aab7437ad3769a5538e2bb77aae05138514da32b91e60a2acafe06488ea9f66b4c5556c0af891cd434ab8053c2065b1ba413a395592d7983c26c95b5551dc7c9592f7f4a31576e7b97b263dca3325bdfcaa1aa752fdc5b0e2eb9158b125773ab8ab89420db0748d473084c452c98f8bd987c7a90c7a4fc8ecb3355bd09252d3cd84b9876bf0fff003b2f6bb40ce5e5a39be59645f72ce8ed22495a9edacbc883425a47ddc6a288879bfb10f37d323cba127d3e47b0991a21a9c414e9b234d377fe69a506e105d28881eabe587e4d8b4d67b0c86a544fc4258a8623db367d08b4ee893c0a4e8122936de10f77b0d93b71f2270490a1ec6e4fa113a4923628a6b7131aeff50e6a08a5b56621caca0925a563a5e0550a39237aa69f7dfb92e676ff003a0d7c566fe17029d51b577fb0cac2724b64412ad723bcd667c92b95e12131d46c29bc52b97dcc775e5c25c951b47a3dcda4f7e0a80b4abb3c76fe86e99b61f56c0c54ba8b1a6a544928baf6143085f0b63ca248d735e58b3e4463656ed295baa8eb6bf0897e495479463a0ad5a4573fe27ec4fa51a86bfc0990584ba567ff00c04ad39d237108d2461a1a122831dc8dc8812c9136444549a686ac4750ce41523a932310b343397e84b56fc45a12fa5a1213bb65f261dae3ab0e949ba2f9d8705ce9ade2c2cbc43ddb4c5d8d7dd376293fb1df7f4b0de8cc237ea9249f4a1104106ed1040c6e36fd81b27772a0e25e7b957c9b7da09ebbd49825515165b02665d99844d3a3a761654d568e1514bc97aaaa10e69f574f816be0fcefc177d8676dbf56a5263745442af2fc989db24a4c1a0f0d2bbab613b8ff000cf18324c7c5efb29f70347bcbc9fa7c8f58ecd7e9f2865bab96d7599f2dc507f052b42f78f81354c2aab3d18b4e2983dfcda0c2975f72abe3d4d0dc35ff00be2b61230c41765a292a48344c544c921264222d589c4508f04dd0d5b0d84517d5122782436c8043f311aac3cfe2d26f4d838445d8c9217cbdd8cc6cca2ebc87885de17381fd7e50b8510fd7f0e091b1912479ff00a4083761a3d2c35fec1c44859d6886da09ec74964a43fab0a36918ef78f92bc114d6dee534a87015924a3a289e4c8dc2a2c1e58d6caae18b5073a2686a91d92c9cb1a36a72b4c7c1cc49c834dd4ef456e09d7d187fa7485a3978960a3332da8a85c35cc9dc4e6e42a4ff0071697df819552bc39dd6cc58cd5faa39e44c8e111f81909cba585da268c90926f74a67a3dee459abab6d2987f81105a87c58c442fe53594cd8d0d97badf63f53ff00df441290c08dd46b4dc485810848664951df510891a5220d7928bdc582362ee58de894e069fdf61a79b8828e64587af1a1eef5935aa33096951fa9149ecde468b686798de8b09dcfec4f71f48a957ce924974483d5fae0418ddb4d9b0d78d24f9c74fc178d3ed08b89fddc4552f84885425fef2f27497bbe8594d719ea3ee7d89751872114f2543b2517f91ae10ab4c92c548d951354b36bf44ddcf13ea8fc0c9151f8a16c2b6792525114b094ac9bca9a9d030d47eeba45a5cbb284c9d77b91d17b86ccb1f28fb3ef6c5f4c9ac2f95b3574fa9366cd84a92f6b498da60b05f17721ab92e6ba7b0febfe825ad13dc9a33774e25194c48a294f18e9b3cfa94cb4c5ff00b5cb82c83d82d048492da111513ca622ab635d742895488c8abd1047247d0a6c20d15193c607fa16ac6185a48826a5947da448676d0b5d3d43ad2938d44b14133549239a27da03685d3635a3d310d88ff831887a6bd85651f6c89d8b787f8145674154946dfed092ce9f1d873083317c0dd12a5e5e4ba6d3edfd2ec427abb11b3bec67f528fc210cbf0e068aa7d8aae45d882892f8227697e7a9fe8470e7c89ecae12114ed19e4b6e5ab982ca317c2e59b71a26c87576cd46b5cdb0695cea2bd370b2f101748669ecc4b0ebf02be9805613dc280b7f45167cabd4816d2fb8f94398e9f8a1f7dc8252a75ba88fd8c614c6e97bb527dcbd62b9dd3ed0e865dc49fef3ea9c7fed6f48229d34a909764c72a852b1591204627bd1135604b09927252ea544afb7116c3505656d9d11c92e12cbe055918d4cd3de4763a5ec568da13262d3dbc4953d4aa240fd4819fa88ca98ec29bb72fcbf4a1791eb44a3d89d8421406fdd87b23be9d44b712e47bea32c1ee1112d47e0f70c9cc97d90d67874927516bad06251deaac71b93b8879f22db873712c97635eec4d4bf4c4990a1707f223582139ba135aeed6c2d7cc89aa976d629b8f68c0fc17128d870a535580e11f96243091aa835e4ba5e4278b0e424bba1b4a5bacd0d8a5f3295044f6d91e315862cfdaaa44a1e13524ebad6c3c26ee4f61ee33ea9dd29213edd16356fceec0dee7c8d96e7d3bbff6c2fbb90289309d876695e058aefe44b6191b2421a6af454d2a8e0a089a2d0bce44d4c4acf424a5c3a8ca2aec4ee2ab443774243e33ee3f0f7916e45281c5963a5096757d1f0c4aa48cba29a283d39425e962112dd96644b0ae070e763eb2f92749f4bde0442a1c7a4a5645856d05d08110cd9a11584096c236109549895292a0f9dbe8c83e869a6eaa9ec4ab27c38109be1780b2fed866b3f06e5d291d86ccdf61b498ea53fa9b2dd93e8e5a28d90b29421b84a5f5381ed22505175954771add8c07a0a783b84d263910eb6ce1f2237157a529418a0a0eed4fe048fb351b559f79129a95fe084863e8ea8f8093cbb26765cb12bbe8933724b4949c767c9372ed34f29ac35e95c5b99a9436bff636c3551bfe0987c1172082635826e2c9018963544389b440e821a1aa9b54f6912d536fa86c2bdcec493721deb0d24e4a34ec3a20f685370fabcc7de45505a16b5ba244f56ec8d60545b804e25d3d8f607bad84542f6d87142f09dd3bf23f4c69a0d5962423102b20d04888b0cd8d655a3d225021c444b0b653dd8bb7454c3971610c857c9fc591a6988952ff0028dc73b05b0d6e53976ea4bb6e272bfb7d8871c3a55d7b2d864ca5ca13f3c0cd1384a5eebab7b7422d9510c6c5ba3218dc732e4e0a0597dc092da2b7cc294ae005dd0a234c14abfde343a6fd136d9ecc6c4aa3160ce6cd35c4c4af83ec49cbf04bb3652de50965f57e9326d82fcc5b26e3139f22794d61affe040da91e11771ecd3b8c0352e71f213a1393962967020717be8d7d28445849d4913765e5ee6196e4442cc2c88a98db86f28549c94c21d302f3fe950a531a754e3fa5a167784df70748957428b2b991dc108204a44eef0965b679138f1b22b0d72b59228fbac0ca5a4e5d3dc63b6eefd7b87d09af52e5a23d47845a1c4d29685355117489e69271d685269c5f8a8955a1b219944a604a5c24652ab4b818f61d08e8417aab528e1d3c148219be6eceae83ee439741b4a815a4630a21def57613d78917398aa39a08a2bb961ebbaba55d056582c50d8b3cd639262d457c85c62e3d589745d118edec04ed9ea8525b4b6620a6da7b61c386151eaa90a7abc0eac7ac2577b89a09a95f9312b8f62187b5872d724099d1fdb3f4b1a7ff004cd77f645df6c4a359b85c8a3d9ec3b565fc10571270a496e82ab8c232933224ea12128206d59b212751ce60828ea2349bfc087444d524527365e64552a5c4cae07b3facab1cdc44a93a4b5658cb9afd4e3fe05922a93c78fd900faaf04ec55195146372176274ff00d74816974ec07ec68e5f026b5593964a0f97926d4e0ab4d59723595a5baab9cbc93e995a0ba082090871c4145ad210fb08368613862d06fb98042ba5131fdc3de93b8aab4d65aae8c4e05b875741b70ea229a85b6c4f225c89be5b5e3726c9c539a18de33ba5b82c440e62127cec576e9ec2768c3ee7fb176443927c928db73d0d3f35240566f1fe0bcfa382dc8ad78ec3a6e08b395917c238dc7a6897ce427f81521bfbd21b3b25c5352a9b7fa3f9abc02b784594dabfc95855ae076eb7b8786904db0d3b3f43426d2ee27ffa12821abdc5521b7b10412cbde7f83d86ab41c593b8d5d90249b12a521b4c43b904a29fc11d0249558e6b09262f9ee354b9bb1de9ac935b1305b899f3bf81a556ff00029683c7645926fac8db7f702c08765164422b5357ec232bcaee586a9926f12b2237c8f82ade472d848e48702a8fc4a3b4756e05bfc837bb179e10aad2eb28c533bae4376687c228ca6f688f518ec47a100a3c12264882eb908104d10da51196ad7bbd861d6c929d8e382ea5cacf8dc9a372f3c4b13fb27158c5bdc855491a217c63f7046cfa15e0e9c0f357dca89af83a994bbcec3430aaae2a12b55a4aef7058605d51ab95de0f75c74a4e8bc28929f5190a28be86753c0a09d9fc7a40ba9715dd558a9105a279a8373a0b579fc381db39b09766a5d8ecc6d0c1e3b32169448b1571f1231b65baff008339d542b672b0c8be0bca2cd7a1a17fe84094b9129c15e116246f6125466be493141d462271d47233086ab1d5c7d42b0a9e04fb6208b83ac8cca94f02a85adbc8de65ac4a5a65084ee5e0a8d88ab1698e34ad4f78795914e7f1a751afc338f72167be1585b32637a75b16e7c0f3649aabbcdb1acf16a0631c31c8d24da47b885260e7997e8bbeb6eaa556fe46bd59eb104957cdc5c6a6a5372cf2f61126b661c3dfa0dfa1574d29a4a28989ea146234d124e891b444f4340c2168b774912e69fd1a2bb528adbee5204d5ac938c1026c2e9bf25522783d88706e8c5291c702ea567612b5f431d06d691d2e457dc312a0a4915296706aa8b1b2f37f242fdf12ae4527278523775d375ef29117cff2a1d47d92ac0ebd827d9e744495f2b43f7499e3fe317a554c1502f673ba632b10dc4ae7e028dad7ef076c3f2be4bc92a1bdfd13221135670fb3f4209ffe76827f64d8260deffcd12a4ec47708d2121e2a231b5c2b98c0e55dff00044544eb0edf92848df80b3d3447192fd16d61d60629bbf4918e7eb91cd2e9ec371557105274b698486d59fdf5141d4bcc09b2417a6bea26b68a5c57744d37669652e3e9d548c5b28409cba9171b0bc6ba6e91b2508e4e243c2bd1d06c413554c0fd3cd82552bdbad109e51c26162965f027d1209e8098c2884be989248a220992f4a2625131314112719f24b128541501471ddd064f30e5c88ea0baa4bfc7522bbb24ef586c8139173e85af195d0576bfb2e54e5dd704e97006cb0eae32e826fc4137bd0a5d0c510d84b568ee88cd2429c2e56828ab696fc49f4359a26853f9ecc7738f342f567a329ca45d9569d32a9824dcfcc26612b721aa209f664fbc4af8212cf42cba525f42f01a53f039f74397c22e19b9b74ec8b026aa4e57951ac0ff00f3b14456af6ea4a3505a68b5e5d88875d899b0914b92b48d87dba149194353edc728ca246791c3a45dad9066daa6e33ecf6228dc14cbdb12226a10a1d8936cfb0b49d111d4adc8d09242951c4a5c7b5086b86dd8856eeb3e91b92364a9b1f4dc5d8d896d124fed4b94fea14a309a51374eaa322369f8c3e20ae2a544094452837a3abca17115a64cf5541292b84e535eb72510b87b0bd520e38c29ef68b1e82af505193a168ae8251ad28ca3105a082e1c96653f03e4b27b0ef7031551168431c14238e28b119b493be211b2d4c1d71151ec37aaae4d162f818539b3fd650acb3a5f8eece08846e10bba32ea5de85a5eea38b3ee1012dd862a4312ac10404dd55698f4f74654e654955756d3f15a97f577502d26c3c86aa2ec586e132abb61e08b6b5f8bc88caf413912f95938192c426eb4698d797eea2f667e15e2ebe1d04e6abd151a45ff00928119162b0327d3f22d9891468aa2f22af07d3615210dc8dee1e085dfc24fb20a36dbdc5a1f027f792285e7d2397178863d523933b32c872ac7fd139388f982291243f84633c0f51e1ae0718998aec971d28ef3ee511b8460326972741ae1b58590985911762b27493ecdb9153078a3fa4554f16a09b07f8ff45cec8b08dd77a0d4ba90b268f730a08399a35851848c557f36f424b12343e94f5b4ca0b420818c8109b412ec288d204b42042ad9115aa1ead53f046cd355ea3aa23f0c52d142fc90ce14a75bca1d330349be0370d994996177e4ebfc052ea01dca546687ee3e1d6dac4d3d32ea46b4ef37adbdd57215524b72b1d254559d65d90d7fd4b1a4e8d27f02d39dc5775443f9caee1094aadb6edab02e745eff00c2bdec8e4b2ded6e973fd1a901f19f06c83fd9e5095420c3c9f8298f51d9a9ec427a211f5748787c1553dc29077fc429155594d79ecbaf44829b3bf24ffe44118cc7d5b0f25509782471d34687672c8ab134c8f7288fb5d2329bd37d8bd7fd825350ab442a38e9e595d7ecee2e18d53ff427ab9f783c43aee118b0ab2a396568d85631a452397c8a4e58d88825b899a5e0644d26d47b5c5c1353f649c4bcf9e82aa8acc44e5d47a61c3a773ba426855b831229a577913546a393155d8c2db82dfae1fec6d8fdae18a14a2b17819fc6078f4289082eb48269b74904148206c412258a45dc4121220812109311f7b09c5072bff84ba4b72451b961379370e9b5655e2a536951d49673d04c0c26a73adf6685b1f618a76cccb8957502d4599c1a0ea1cec14a1c05fd22b24b7e04e7ce4ea38b12f80f07b7e36f08b30dabacaec4699bb72cb1ba4b664f793d64f932ea4ff6343ae50e28aa58fd17a074ef0aadf28c9003a4043114d995d58b4414d2144e6dcc2c3946dd575bb5bec64066ab37ba7c9368fce38220d4f7125b994e37f42e7ff2ce08661fe983ff00069b2229d17fa4644afde348d2d3b9304fc3e46e892c7c8f4497b64228232fb12b65111eb34365f599b19e1b0aa943a3a8d4129c212df76473e8342450c45cb2e91240d17232d377553eca50953737ed249af9258b11d1cc6c236a53be0ba6ec53ad0ab1d46a89ce324e1d7e6591b94d079a1d171bcbc938ba7b8ab0188b891faaaa539becbd525d01d9f41442682eb2bb884082897a210848d0c222b06e05be85793922c7d455122643ed45be84289d4946b262fd4afb9638d8df0654dcae6597d6b13935d2e249b70b767d89f10c8ea5dbd25c3d92636e1dcaa6bc2d2d8b235b9f526dfe0290739ab5b0269d644a7df50d66bd019161adbc3d723d937d55db0c91e3ecfb5f3f257358be1214e538ecfaa1d079caeeb04692704476bf6b0d32dc3039c98a3242902b70ccc13628f0a94266a13a055836ddda2f9d564b102593cd0d4f71f692df49fe4917ed84576e9bb96ebb4e22f95ab441524ffc6ce42de20891a1605922e23c5c6a1c312a548bcb1d2c3428704d6b5a37227c18d5a49612707fc174dd94bda63b0a8e6f33d64812455fb1754a15efb08a1242f9f81c7222119828020de00fcd0f6a89c7b89afd0bf79168a9c9ddcc37ed04de151a4736c9483cbaaa7accb6c75d546415df22aa9aa7e057f592ac8aea1da7a8d46a3a87816d54b21ed6c9c553b8e4d0afd41e5ceaa2d134946424dd09b094908689a2d8412a17c84f84925ba6bb2dcad75dc6c68dce94fb8d5b9b287ee12dd0a3c792b8c6a1a744175d2a7cc0cba23ca16eb3f31dc937517d9091d6cdd7e50ccdbb1316957f626c2535210c4e06213655ea3b912fa8a01284135f3b94c556f0a6f71709ab40a9288e648a24bc9918eb557c01459a5c11467be5cd292111fd8ec24add9f40ceaba0af352c17afc4a6b540aed72082973024ad9355b56ba32a4270f236105086b58b0f8637d0ccd10d8ceb0446ce722f29ee29adb5b929213162daa652bdc7564a4b67bfca1ab4731e191b6e9aeaa1fe076b103f08e8cd970bea51e356a49122ff00c291ee2a915826068514191a54d9157f64805b8470ee6f7261c2541b39fdac260594be4a04cc8c2ed22b697c8b12feb6291362659c3d88ca4ee12a656ff842ac5125c0fda84850b9806beebdcbb67a8f93f80b922496675f6311621d7c36326deff24237dc84d2c1771037b8b41a3ae9f685230fc0ae2275a96ed6636c0983957d392e1895a4a911784a59c38dd12afca8ef95aca3448f5108589b891aab4be963b23dd91e64b8780fa55fec9345762b0b43c2b8d73571b5847d32e95c2fc86970975560ab11ec0ba0a9f967978ec6009c25ee624ab9f31e44fd1e2658cd77c9f7172e5b58b3f80431b8f7082534696efe1969f221f3f04b41358635229c9a944408276ab14f3938838e8b5793389e9c54ab5993ee3dd23ae89ee25716e955dfaf279b6baf84eb31570986ab0aa553747c124fb1ee4d759741d928f73e65fc8bf22d2592715453b877c0fe52418663b421699f1331567ca741fd0932ae82f952f15f3b0d7dfa904e3a342ef26f3cda7d0eacadef59465ab35b9f792fec3ebbd2cace224ec7ede6a3e456d924dd99ff00290e527f7ed3ed563dfa9add349c96feeddd4df50380a3baca2e9f3aca345fff0012ad7af8d1585a411a4df42a3a8b5bda46eb50a4bd86a53892494b82330feb91b4a346a9bc9065bb5d84aa2b1d1a37ad4e9221ba917a989154e21335d5a1e8c712a3d25fc1297f021e085b03a2bb1ea86c626da6b5ee591e90e5568f69b126de3fd3e4550bc2d79132727f82d3c1ccb34e4750a561e1b62e4d24b1910b2d5f3270fa0f6dfafc0da55bcf66aa2d0ddd215a2bd3a0ef2c7d4eeef2cc54d8fe761eb1c913d17d953e44984e27d2ec3168a8fc9989e20714c98ad1b59451858c289fb51345fade77629612322bf822d52fbe7b6c28a68dbea64d57278aa3ec53ac57770658e093472b2344d7014a7d549cc4ff003b0d6d3746fe763756124ca0c6b9714af227b0884554e4ef41e312a16ed193fc0982f6cc1864b992c99215526ef2f12350a1ca9a3865bbbfd9b374d3c60ab793705d821a0e04c282b5b7c83b923754bb83da8fb99401117559510a7828f7898bf235a2391325bae29295c8a91a54d92dc9cb813aad24a85c257e8d8858750d6ee249b5bc44b394507e251c15719544a254149d22ca5ef4188c30b5f7d856682eb5a495fdc5cb2e4c4b1a5ec9244987fe49cadc74d2b4d7f79d65541ae9ff0085611842ff0006fdc29726491a9131a22f83d94fe89a72813c8929d07482e6a2d41536f1786ba0eb42769bfa8ee04e6853192b35b7e4bc6ee35257fa4614cc9f7652bb0a038dee94188451141bb2ac4299cb6df923ab8f059274955775bf72604fe52243a305e079135455bdac2d937e83229b17f5e47d734719bb163b1097673254666b34174d3a7b2b2acea32468857072244f62fd190f2a89776fd82d8978363f814c1c34ca21d1b3525948a19e32bcff0083522b02549cda710cdf2451b899b8925bfc9f5d1a337987b12dec2b826eae47768fdb269d3f64359187fa40d42bc043425c86e8936aaa88c1226d464e22bc40ea1370a9bbee0a27710db1569dd22889e62a91ca869d4ddd50f8dd1bee736643a037dec943ab2e6e9f8253ce90a375f6fd06e1c50a3a226369c953b6be1e04ff0062375614c04dd394571a5bb45c3d191dd3d3c648acb8117b59a95705c1585192942e2d3b93391ce4bc7f28874ec4e8bb4cdf6277e217310fa8e5caa3044bb0e91867ed44b712e7ea822d8f6c3ea370fe7d0d4e50dff822a4421e4b081a424f9f8d1172723548b9038dcf7ccb3257962469fdb11109118451b8a0fdd81e1515a48dd4b64bf06c6a0d40f5abb6c6655b5cc6ac7d91a5dcbc0881f9eefcda42b814a4bef7bad06826e8a153ad448f72fd93eabda283928dbcc911377a107d02ec6d41d0bbfe4abb35aee9a8fdb9e06048e3749c0daddcd815bd122543222f28891c2969a155a440e10924d81225b9115ff03378f124761186508c236079b4889511937610ec89b9702ea5115ef4219a936455e072dd19991e532e4df5321195dc4a132c12d88ec2155ec35f931a52a51d6bc3127973f26d43df7ec7e5f95b13854a96f464f537429bd7f0485297b306041f6863af4aac6cad5f7ee4b8d1c1d5d09e1f273a6484ac9926de10df6b3a43621ab16ef411d89aabb04b552bdf7c10342e9a5386b9610b34477ef46eb1523b8f577e7285cb912286d57925ec41d5cb7995bc53b84e5bf4e2c6ea825607931efdb5ec49ebf8963aae794e3dc636f619bb571e9113a0bbc172a1187777157a971e60753972bc2cdcc79d609b967ec4ff00de2a5e2fb8ed2a29fc11966c226058624477ea58d0893f7113a925ff00c4356a095921a9a8b992327dba9718c1f6725f1efd91f9f4289767716a4c48d9ef81a2a7bc7f2210bc545ba23fc09365142ee6d328a1b59bd2be48ad7fa24b50ec20996fd44ca0afadd8541a733f39130e0f7026e6597da58f2e15016ceb2c5d910aed06f95272e78449741dacc1ecaf303a0ef59cf0c583b9589aac56108324cc4225fe44bc3171664504aca17b10149588c2e131dd02c20414868507d7733b6377c090b69154108a854e3d555ec2bb0ea3ecc911f56dd9929d9a13e82377e6605d654fc211156e487224a29fb13b82f6d1297518f23b6560a256ba21daf654d9420aba8bacde9815d055eb157574482de1fb1278824f2a1c8514efafd58349af822bfb1cb294a6c4784fe8a3e57f221692c9ae2a2ee35b51a4fbee6457856d1554e838d1e7fa1bf3a0b4257465ea5f26de06d6a649d989ecd8c862ea78bf6882495f6897865fb2d4b52b61156a3b50baff00d202aff808a5567b10d66710227313e3b3f3ab524b22ff00b40b51a91a5105b7204a178b6723dba4102fb521254849b620444954da2450a3b4f71a558942a5c86e2a2811a1e15b62d1e47fe16b23323d18957d5fce88574eb9790c4c35daf8999208e3fda0a6a96ad7ef25b7b8bde4952e19e8c89b14470e8f983d9fb94c3879281ae7e49d7543e2a846bab1f2e9ee53dbcbe6866b712e60b7652b15e9929e39948dd15486eea5b26ef0b69fbd048a0d1a771f642a9090fc938f28a2754faaafb0cd33ee67be95a351a292a17cb8c844d50584529d3b658856afb0d284409d83c361a4852cf649649a8a928237705128bf02694dad68f742c07c047ba78633a37dd23687c8b8b5a72291a0815442b132f22e736950d4d38c8e6e31c9743a8530b4a25ea6c17744df365539d3188fc035ca05cf8ca88c58ec4228c4fe4113315f024d6492b24407794fe4ef803d30bf40a0fa0b961066aa520c265014bdc077c8b7d5d059419625392cb94678ed84b6cfb8e4faee7bf09314cb753f8b868c2a80de0f71b72fc0b7be0a97fc03f91244eeec50441a68fdc325ee513995d553b8aa7285ad9a8f1224aa247b9f838c6aff00ee93152216a357ec3fc06ab22248541a230258dc55a08e61d84fae4c508a9f2761597239b42bec2ac607bf1f224a68c50f670193698f96c2605adf2bc0f33cb7f24089dd8f8cfe44874f54fd62512d85362127f4899621e1e454a09604ca7643b066f87b8e8234b8b73c8d2a5bbe10dc2593c4ba9493f69a4b7e564da767c3b18f747c84606f42be4692250364944340aeda5d4fd423f2432faa3d91fbee3ff74ebe0a05139ba226db4ae341ca82cc0945a6486b439445024ccf6f931b825f4b2e04d752268ac84894f4c2746d5ecd58490969e3e49629c57312b9b18e7070b707970204f785eccb10bebdc52da9c624782b2ebafe08d2bf7029bea02429448db90d3b36e8ab8d85496927a8a838ab4e8ac55a4f3d454a99f54922a969070f180faec562f2ee9c1526f3c48abee511bf7d205d591bb926be074f59abbc91585dbe0924b6878b72287cdf9c32784cc9d15356270fb15e7e255f8657b2acf57745ca87f46cc53bc33ebe0bd3cb3271da7d1dd7491ff57a8e649c81b0699218253a338424ad0321771891353eb9270fff000c9354e24962ce89ce9ca1325edf4ca04beb12acf06e3cddb2d7125816845148b0b71aacb4c75191cfc124d44ecb709665e610ac3bba2a2d4a5dfe509f96890f2305077752312b3bcae05710710de04c938cf56221a129a5e451db8b21652b2153e7d881da8dc4ba9c312638773edd283c23372a3cd1493dbce3a568ead455d05f22f812b41a15ba22f0ea3d437e57cf72f21226e284d5ba4f1d4807ea8c447036412449e5c1426597750ab68b2813909caf6ea54288d86d04741f4260488cd4b82fafd6a89b333da0759938983e01a7f9437ae49abe155d05e2602ace0bf80d6f78d3a097e02f4d791bc85c151c709504dd22169d84fd2838a670c5b0c51b91c90b70bc9ba9b0eca797b04a59b2c6692d7431ceb8563def71014ec7109ea4a54e6a844b37b0f0be245d88af5259448a7bebe5b5f923a32745d17c69053648a5c8b177583ee73a5d1de0233abbdf720465a50c6cfd526fe07e0f66a4c919f481146c5972501113285bba0d5dd7ee4be8a4bf4435d17570577238f20e7c1ae44acaff00c1915c4aa2532261bc4ff0971224d131b45bbc0d67234ac426e63ea2aa09516866e361a5cc7e03ba90fa1f5c91425c0dc598c33ecc96ff00d32dc4ac8c96e88eac8a68992b623ad4f6089140cd7827861ccf040b725d84923f60e0d86e513bf644a8562ef1356c56abd9bec26a364e633025518493a2123e854a0835b909c3679636a09de90b7f07747e109a2e723c6dbf42a918a42776c0a34a3f088753d30975b9b65424efc65ad9221a99df71692d341a2094b41958b0cc55eddc7d1db551f6122d17751bb2795547102ea9630ae3dc4455fe085cfa00c5a28690e2742151c3f803e4d284dd3aac8ea179799cf4129ee429366ad56824950f15e2605b8c02e867b0ec356dfde1fdd55a52124a3c43974a8fce9f7c1f60c11d2281ff0071b4c8ce283dbac349436651071a85949595ca2642d34371c1b216954c4a45e532b95452879e4ec77919288cb19ab09aa55ab0a1d8a951d344e0a0437db2562329892698151b8fa516ebfd544eecd33a3a5b6cda45c44df76304f4e450e62771320257295b0bff000910ac4d61d2d3bb3a809f1812560bc7d917ca121dc9296ae8eb23a741da096863d8ad59114c63f224504881a989ebdc574fb5303d07b3d93f23318d96ea72f88d8913a370fdc127f91575da4e5c0869c922abca5f03d0b84370b9287dd0ee2590ee9ca1ac5e3f2356ddf3581e56e84563eaa2ab7db4641574ea5853b445c4ad2ddf238f4620909d0cd16293a7ec9242d5a2431aae448812a564589104f48d181495447341975ae0f75462cef7afb95db97491ed0be69b189a5da1e55a1618259a49bdd91a13a452c34d911d093e629e725396a15db419003554cc1d97371ad4a5a69386a19fd90da0d6627713e4825fe10e6f942b4f3b93dd07d86c21263dd07330f4226795c55130607e1a157c9e9d60f46570c38d52ae5689afc6b024556d5babe9d3d1237a61ff0045c6bf915481a33a30f0b193d87412a06cd71bc13235421ddfd4313dff0005381acfa9246a5ab7512d88a9289cbf81b2cd2cabbe8689f797649eb47de98c93ca6e9296b09e05a2825da972bff44aee04eb52a7dc39e88af51b95c8da2faa09593494fca858a39217c0b840998e2af9bc2f3027553f2c6fd1f6c6c911ec4ec8751c64923d842270dbd95c484a40e468486848201a453aa1366a6ba356f45a362ba75048b8d1a24e06ae242ccca9814e90a28495a11792a04534ff0046b4ace070b3435d8eb2435675d41239455788f78c6be94ab0f790c9d86aff003166d2241138cf1a42511b710f52be282b2e1d16c8851b690aa2b42487565336d217ce93ace48626a7471a8ff0571373ec2f529964bad04e7d0b69bfe4486d24a88585f0445bad07474d1bc139224c7a9360818c9a249a09bf1f92029d8bc8958d15931e9d7f0435ac80704b963fa25936a9704d4ab415a887239808a3fea6ff00437b1f035eefc0a936e3fc12bdfda0457110ae026f4230a7baaa25c8d09380d977a29d0890b61cdb1b46c527ab16ab1b0e84208e884c512a4e896444312746a5b5f44bd1ad2282697513413c8a94abd46a0c4a759152cce23b4856bf808bf2318e24fb7fee5f919c70a5aee3fd2c05bba1f40985d17f9b5f91072f90cbf07491aa1c1ee25ec3ab39bad624502985fd1a9a0946b2b54bdde1690ba3e656590cd652e4a8aecf10a3062e045675d232d4d5100895294adf22ea5e9512c6b5e1172f07bad84f54a71410692a8909049b83c7bec2eebf8209a0dee475866189508ac8e922b5b0d26a85187725235605686a8ea74f7205f782653921764352467f23d525bfb0d25e7f1228408abaded74fe44a45aae1cba908924e15d876c74769cfe0650bad4ef033b3e7e4a670bc2e5cc6a2bf5f0256864ceed72c753a3547e50df8df029996e3913a0fb0d7853e47af65f03f40903631311a1b125956c2f226282946acb584043a9904a745bd12353a150a254d281587e9a1ba842245a85c443553f314a72977a8d8291f106ecef24eb7510f71a2d2637098c2e5b58fa8e8aa2d3b8fd21af5149b922cfef637d3fc26f9472501f8f4e1fc8d1867ce41246d22c96ffa259b0f784ca91567b1dbb8fc13237463301a0a6d2e2c4aca180982ccdd74459a448ccb754f91726e435e2682b5ac34be762b8dcbf81e49a9a18e893f22311a4d9d914b8aa9787926d5c96372591b95d97717a7b15d849463c0d10db8124c2fe49299f0c0d9166c5d2904082454312a56b7277d98fdd2253c91881a8145c27fb4d0b6e593512639655f755e2242acdc25d22e2f60c81b48abaa7f07515ed023aaff0054266e9c3cb43afb1e4c3eb1520ff72623dc435e43687492cfb16e12a812d2512f40687a133366fa68450f4466a0844fb8312555791f24c98a98c5727a1310968451ac43abc03644d0e62852cf64fe0aa5c27f80b8512409015120a4c55182aefa2bf7788fe484612f15c5f74299b89590ff00c34cf86d9d911e0b7121cfad8adbb70bdc9b0aeef98bf66482da4ac672eceb1519d38b8dd589651c759164fec8dd0ce69fe2d916ea51d5ee4cd18a0ba1b5686b3ed37d89bd6e3de53157927382f726a5650da240948a9be548b594e51291bda791e5d5c7c0b26bb1245e0abed8a2a88c34314d616379e4e64617721ee13b63f3a1acfd65628ebf8d1213368d3a1acbea15c751cb3c8e550ec748aaf4c9ec0239f3174fe88d75d74aaa5889374c8223107e25a454b61eff00d0a53b8e50a9a558988a0c8de850249e756bb05cb16f742d23c998d04fa3604ab1210410c20c6d1be81516113e9bd07444bfe11a1cbad606a791c68e7f026e0c696485ba9707df5f45c7121ad25c923e82090909e8a438da1d65325c28ed0e12362a491d5ff079d84fba12de05573b2ac99443da479272d7b143a591d98f152a1ca942349722ca7fe43fc8b753fc23e69b14a822e07e9e069609288e53742e534e7d86eebf6443ceeb88c0e5bbb6e37e197032455921b5627dc90744ff00452690bd1f83b35bf641a762f1b92a23eb2467b9f8f44d5a1292954d83369436cc48274551d1f5f4773ca1e9a67fb0b2268b254ed362a25ff45ec1ba72fec9ec28b09525932455887714398e0725223711c099264709344e5f58e24cc10dbf209626ade2a24c64e46e04a291c942d9f4a9743b7f07b4c3dc777b226ba4c29169494325c4dfb8b8124b5d0484a5253d10dcce20fccba1742b6049a633e64bdd103fe9755ec3bafda944deebdc856e47bc40892bff0034e7a495efdb8756f32365884f4218413435605a2440a04d225644efa14c2d64a6918a4fc07e8b5a08b93fc0e3897eeb82558a40725c552acfe8c613094dcea2b6825608d02b944e9b35a102db9d86e2da10da1ecb3bb75c72493272885a4d92af9f914d65725c4a63b26503fe313a347f9fea1fc88836f66bf0259fbc484e45c8796dac37986eff005a61059c11b08a4de1d3b5c7ab9f930a9254a4886b55c0aa509d5d85964f710462b11ec3dd4bdc6fd0f9c741ae9e34264691b4896e7c1487c919843c88bea1b6d88aa3373795f382434c5106401130b6f13b8a5560aa5e10a17dab28d91289a5f687226c499cc85506956172efb1336b1775d9135845cdc3ccd3fa2590d59ea2712591dd4a85c3227e10c9f642553d91de51a4127443378b6154b42494b20667f04551cdd9fbe04d2924a17426b247b0f6dbfd88f02d706e1fc1246d70fe95a1927d991ee7b07fd45aacc69488722e464f79fe8b0c7a9103434217094761bce2b1b6da5b0aba9f731bf96494ae783e30dc2a9092890c9bea2060492231b413a43c0bb25f576f613a7510de1e449d28ff0064fad487975f7f4298d8b38b2ba134ddee553fca627bc90b55279089f15205151cdd9d7cb3eadb0acedf048dc1f4f9a6989237f65a34bf7f8e56a94ed919d8c9fa6ae2f9bd8986efdc4850ca7726a9ee2d7eda74d39f0c78d8970a07753ee114b692ddd11544eee84aecd3f716be084f51d5c7ca4fcab8b49c64b2bd302e8441037ceb1a38784f662c24b4722f871185b3be971e8add7afc92a6d5136e4edb0e9af1dc9c6496a8b9912aa41344f424a7ab31a44d0ba573b1159284215c4324bf86fdcc1f4c83237a5267a8d3821a4d4aa63a61394fc52408a3a1af28656cfd89fc8ae94cbefa7fa55e49ab73d8973d82eba2879292cb7855af05eeeabddd8b52b032482a0a4816854ce7903aa1791886d096861e42c5413762ab68aa5021198944f244e7455a0f0ac3ca4afb8f28975a5e1908550dd56e5bb9c4586222098423886cb154bd2b33231e780abd709d63421244a47892a49577239212acba5b8f4092976911afae609507b91525690d91e4a0f4afa0b82a2a13fd857ca2eff82c161e09ba8a35ba318e6d066cd45aac3ba213384f2e471dd0852f895f8179f039c5e2d0c4aa4d22f0d175cb1ab1f73f03cda89d00bb3b59a766a35c8dedc49568ac9108eb045d0a9328232e6b2e2fe47fcc81dc89f09552999434e590939725c733d487542729344c4d45a253e254ce15722d25553f45c52ec3d60159a78c92fdb9c88540634325565093d5b791621486397012ad45bb6410b67b8d4877246a1b7d0476f71a220c9e845718aca593315eab6639d4695194310245e0b8bbdb42f917c1bddc2168e14e89494eb6c6daff008bfcbf238d9077b63e07a30d16b85d991c8f3b143a457dc66874f631261dc5de89db02aa5cff008224e20448da7d8866d5e605c4a0b5eb1e40126f197d9096258f6d54684114ac6a2a5e8d225f939d5950920631a50f45a50897d15f132882ea962ab08d12c0b6337412148d044d728bac3a88cea70dc8851c4d0aa8a4a9d4b9de4f90893694f8457f5a8121643e333b4426eb28889ed3cf51d3fb548a2c457dce20c5058b982788ad0ffb08e89a37266530d4ac42ac3d878a6e9d0a60a449338108242fc6207f2110656672c4704a5b70b3388a899ea05a484b07b132937389e3d11e9870e8f7dcb2733f224554dc5b06342994c286713b06983304c4460ba52e30d5fb52b1421d0b4c84124b0fa9322604a0acb71b7b0d60ec4b8a6e28314484cb9bedd4c8d5d1371aa53657d8a7bc17ae8f3abd7e7e63f98cdc938533d9175dc5a34908a7b37fa9257a6bdd55667376ca0863af5294b743a0db8bf39654a70be04fbc895b7772f8425421509a755a2511b576dd875a47e5a302438fa1e05a4ea4ede84848b85c48ead47e445425c7a4e9912d573d3a6da6a730f8134d3f4c5b89a12a902d1bd22570c12e8d585224f107050bad69e0487a5cc8891ba5a88499ee20b69ed554db20c0da513978c468569c6e55d8a35ed59a5a4c00b361e2bdc9561d96d9823c9de57069176d51494ef95721374dac4a4ba1bdc321cb66ed8cab25b54229664ac3ad96f0db8b6ddfadc293dc720a5deebf8703fc2875d9d7a8ca27dc8844d090a8d7f898e6359992692a148747233c5f88596ebfa529ff002be292e1218990b0a21910a2e97b4c57a9136157f6484925265ea3454c8dcdd6b4c40a6d1b4aff00c224b91299c22d1a1a4c6a834a2c64e7ecbd326295849cfdc2815a50f5a1c63cbfb612935340b94872fa709e9ce124fdcb790d3838e836d55fd4424a9673e04ca625b49d8550a524505956495cdf6550f71286c425799e1172abf86e3cb3e5f2355f710c73bbd1026dfa1ddcbdc6b42187274e3f49b61eb5174263d8761d16d226082c2d05aa7a6929140f543094891418de85a492401dc217245611321d04b91f51bc9476a51644449f78942cd9f1e823e96db17efc8abecd0409f7f21a86cdf0c675fc28056ab12b6126ee8a8b5be9966dd80b0a854cb1d2dabf94160056014deb472367f617b8b291657fd83c1d8fb8769a6867de09a548b29b2cdd3db72f1416b2bfe0c9573471d84cc25b42112e5ff836515ae2ed75f03a69a4e9eea4c892a7fd1caafb381bdd90964465f511bb2e828e50f828b9299fb1a168fed464df8f24c328eaf8204a843762c8f50d20d32254b3f804ae88541b37551f80a24ecfd89617d8d1b456992cfd62508ad5e4b5f31e06b0b3f624f2fce98f214220816aec7a894a53a06e81781a04f43e8886919232ef45a85f059274962aab568c30ce4c535332be4c0cd921d535fd109928e2c8281f512281a5427aacb69b8f964a8862966d829a5d8b293fea08a0d97b1092324fab40940d64d38aa19abaec3ebb8be4779faf0a34fb0d9e9703e68f7342adc837357f7c90288fb3690c51683d989d893da82672471e166462cd32f4f9fc8f1d07e4b1fb3a27e4ad6fefb1692f8f82c971a8928c853cbf9224bb78e44a92cbfe102ae1eae9ea316b40c7921aba610ff502dfa178854228e0641ce3c23621423dea26a84a869130371d4551f9b4bfe0d5272c8dd83635b08b21c8e2d41ec5f0b028cf4292c692f8322a4fefb90586888a7e1947cb2cb922b31b20962eeeec45dd0be4fc081b025170cc7ad4ee042247c1cbc0c0fb887542c4882d13189c64e89118da427c32114cd8a676eb823768e55f722ce51bddc794268740d1a14848881378228408523289b0c26262ca2c44e8d2c9bc669a5dc8dc589e13a3b96644a5c492b7b91411f5a478fb9512361eee2c1a0707b7fd618d3d476f03d9b45a27391d46d50f147964afbcd1883be9e209f63ccaaf81ad8f826c6f21be450b8bc39600e931b23f593751f8208d2afec737069f24479fba442bd6291c52a98a527f2531a4fd8959af0635d6b45f8b8a552e53c7fc9e8b1442afc0759b471920ae7bb4a5d7ed0bd2ea36ed36819c8936a083ba41b6d8796c5148e7c8cf3caee4dcb231f254515de45c12db862c5bf42515139916b5ff00745b223c2495bd76bc489a20ba0b31eb83f924dbf722d5e57b226afb78204cc5a7dc8ad742b9ec3905ec79eb52513b0ee3dfe45b1122267ed1a10656e593849c9f51064693a150dfa1290d5532489926d0e38ba1b8da4a9881bb27c8f4aca1564fc09a5b1d941903c0a6271923612d086d630c54876589c098c35258271d9d0851f4ecdf25ab49f298bbadaec1e8d5171d9ff46f27cd0d9eedf174a687d8b83e3bdc3894ead16685587acc40f1ef0b8d18f2bd4e2b5e521916d1b459b1db67f93552afb2f165a774bbd84c54e653ed5ee3a4d21d4796278ff01ede9921b4c43435a9103e91cbf66687a04b522124924ffc593694c5f9449f9215d8135713237fa8a914550ab06e211c97116df041a7546d414dd8a04acbb5070e1d47bc172625f215fd84a14daafc22748ff06a681d286ecf92c6b228f73da4e84e4c813213261f3ea87534ded1e07ec7b98d2998b89b871d8742a7e913ec1524379d1a197127761be4a505a8830355f4a5fc912397e075492dca6264d90e4e1f3a658f5b625a2d11813a48da521d70bbc48f685b16c578e82011126249a81c61291efb914175606f82138fc32cc8c410288613121084c92a1aa435287ddbb1806be04ba5d133ba1aee0b0e29ef41fc9f00ff006b119a3d83368da2f91fefdc3f6b0458355128be46f083d27fee6256376c60748e8f05753232e2a4df6fe0f1d2fe7169dbb96771a0aed472e93d046e25fa93157d423b8be5fb043444b8098a113e468d3f106675e4d99586aa1f59c35ee37591930c90862527d701a1338d13225442223f02259237aec4242e5b620c4ab7411a739fd8ed5c50aaff00d114420eacb9e747765c0ce81e93b8d217460a05fc5411c14a4ac65acc0c52e95f65b0ddd891093939b446bc727710ca4c9a7cb6a47067ed344abb1130e07dcbc6e84aa6bfa52db7ee2e22cb292e245d216af14eb816d779f451fb8a6f8395a9d48cccf828f02e9248fe85288a8ae4aa641a4a968a99bb1ce0b628b8b17053e98f148d3eb11f20787b8ebb8e1a431edb4e5fa6b04086ea2153c9db0c21212d09898989e9248992c54c8ba5a917734d5dd235e2f70343e8f02737da0362747f723d3a1fc0ff006ec178a885110ab0654f65103fe9357e345f36fd8685eff69fe04d5103acd4c1df8f14743e8ba30b80eca8e16532c7891de0d0d6153e1638a3de7f68195ad9093628c6e2aff609d268e9558e59f22e49e8ee57956d30a7fe0a62ad76b11bc9b569f2c815130ea268a20aa833e85a385e4b947f6e26a7a0a5d29e49ad703732e2efc22ab9b7cf039b8fe46b7da109249b52270a55c84b51b26e59063439ace88a3bd591a581cde73babddb272495709970d4ee1ba9a0d65c22e10db80d7ec3245a9fc455718758d85c125422092e1939e3c9ee518653aa904e8ff001a9e8f451e90fc0c7a4f9a8951ada6b297613b237a4a9a9bf68c8161c94269889ac1860b0c9191248c2648c3123648c4e8c5c7d6a35a99bbf10b63ea3608beada428b085a98f92837db80f5163e409f71b548f08feea39fb952732352c54be7f2e99f800526d10a92a23b1cf49f2d93cbcbd46a2acc514e2f521c391bdb035ddc2f2c8d8b7ef1107d952af2aa84a08e32a886d62db764aac56851b6fd7616ab370a8bc9c627641aba4094a20458bfe0eefb4d07541529da8264afcf249bdc4a5d049af51a66c86de33f058257a2f725d88c48ec412bd456add782b91ed9311e108fb81736489b97fc0c7293d86a2159292a19c9e0a02cfba4a32e9abd0b7239966f56cbf03430ed1d04bb095426306f2a3a51e637406ea9cc8d2845d3fe0168742143644e9522826aede484aab0749aaaf23d2166c754e57c8a40c919030e6a072122d0a220c47037a231e23174915d2199d1c42862c2d591335cc2627a0b42648dc8c3096192770378649b84f3013ea6437dcc353d0d8bdaa87f6fc03468f5b85afde46feceed68771280d4f8e09556222cd6db52fc8bf4b91494f7f2162524da5d1de4647acadc6c838d20bc865c62442502b28bb20213747cb1082373dd90c6af14bb8e4793016b9e7969cf491149942e88842f447ae74a14cd1d09e1830f91388a5a0aa771d318b8d2f263427c0d549772c5dec609094b4408e9fe2141f0e7d86845b923a136a5682f9fb26f8fe94b40ae1926fddcbb23de3e75595e2bd908e5de5e1b35ec4d28d846d34aff009162fa915c8423fbb0af3bfce8d5647a46971d8b9e5f03a88a639d1b1924273cdec5d147298177857f61eda357448410d0b4ed13ec6016d346181361b34430a5a25cc0d453a6d50206aea4e8dff43d6810c489924898c3744324ac68a9535b9e193378fc8fea32c6fbf8242134e0f30f81e9ddf9d1343e61e0ba3e469fa88fecb868781fece06488242232fc3a11616bb43f90d3a2f8c3b35b9c43ebb13988ec473417a9da3256eef6c9fa5813487d44b5c9389b8ac9b13a4ed1d5063a562f743a8f5b78de6f22b29d6606e5f30251748527a263caebb286c7dd9845e530d427cfa87c8c154375452b48be126eabea91dd370e87581923c170c557c78c8d424e2b70dc8893549ff1124e8e5f513226c656609231e4ca084933619b16cbfc12074dcbb0964a092d919d49567bc0b15688c5e465443c37325cc4ab9455dc951b15ccbe5e589a4a0ae87938fc94ab6e31422a4e63b0dc0a108c93e09a0dc3f4c9269af78dc227062d27442e5c34bcac8b63591a7d18d73868e981a184c6d697a004c0b0a98f2d266111d34e9d0dab69428c61848613184263098c3c068546b992a35a527e4ef37e0f0d7e4fa1e49be8d3554f97c0df5e591ab23d41bab7225fc4ee43ce84d3d8fa772ffa2acc7f83b74dc37814705d4bf64f86cd088ee56159101c8ecf08bf63656e8dc15aa815e25912dd7e23b0b9710bf04970c69ec948995cb14f633b76123cdb791b744f921813a95220c14b0e11e9afa174862a55b73fb864032ca765eb235d477179e8232dae97796372a2a938b4911752a44ea1c60cce1d844209ced76f842e2939252d3c8f29122e8ebdc37b926d4771ac8fe996de2836158f924e1f0fc8f687f5b09ad6f1e44b2fad92558d4a46765a50a32345323acb136d17d44a132e8874a6138a7a762553776392a4b2b86adee220ca5b22724d455b3709791d49a4d297e304e90d899a77c074d1fc086943a53c0d261da9de8277d04c4eac68a9548455fd62ba27e4a7b4b4af50ae2b4e98fc0a507dac8ac131d5a50d4733a11c8ad1d1862e846871210a20a4422cd8d22a81922bd14498e27a1c58d0f4131310c48cb9098a2e99d31375b6652b98dcd87f13c49eebed278692871bb8bf03d0ce80a9654519af83be48489865c7c891d4fdd135fe201da5215fb2c2c7470515b9f26eb62a8e17d4cbf036a83dca8e55353c5114ef02aca2613e4931a82662bb2de1895a504dd274868659815a4a562791f9c955f8741a18b38baf924ad29dbb6a9483da9f35782dc585fdb1b74b71d6469a4d9b3f2c65234962c22e9bb279b60d2873d468a2dd7832606051f23863b3d3b91c317413bf4972c6ecd5d7911b22d942ad79ff0045297182766f62885bfb0edc92ca1b1249ae46bf245884a10aa94f3d44b7c08e659e611b8eabd849724d08c884245613270f9f0568fb0279e824a5cfcb1b1f50e5c4510abd8939a781295a24a311d9d24bf249ee9782aa563e60a6bd042a85ba1313a8d240fa95e625199f59ba9182eab6626783a3916ec38b8ae21b269254a1d1a1fe86a2252f5338957abc11a95952772ab296998cbbb1174f4c0d8d8b427a0aaa1a4c4a89b13095851308a2af5903420ca503086107a14f42163a883cd0ac3b409438f88c9f694249fe1a2657450e87f037b62559f1a51edd32eb67727b4a1bcafc093aba13c073aaaca6e88a8c85a1573b9f2a56f1151b1abc2ecd1d1f4131493612cd7dc9e156e83f49195325737505ba529830a78b0b1f683749b7d44e72fd06d92c8e7745722a3d39039c4389aec89c669ee2bfb4dcb9370e244929498e5b6ee26f5a45b2a735e490b4f1623b276ddcbd869264a88a250db257382b10e9ca28172cf29a0e964362b53287852ae4359d99926e78187327ee4104adb52b26eb62545bfa26dba931084b156338e685887d8650843637820bbaff00a5e56dee434a2498546f2f8ec3dc787d48553495e6bfb15de848f04ff6ca4528a115cbabaf52e9fdd869121f6a30c511c8d250fa4fc1421ae49499a69df23685817eb3c9751f13754d4ae37a1e5f283ea7e842d68973abc919c343d20a04115a0791888f01b424a3009d08430f445292f61e92d3556955a1742ca43a9431287242da2bf31b3766503ed224fd3a08af79f84c38d095207e09b7c0ded0eaaf84350b6d16415f6e27d5b409619cf42c84d49f71bc24de5395a56c87d78f22284baae2522ae5ec5155509e7842dbc495dd84d33273584fb8c85e578132aaf6193bf8a1410a693ada7ab911025c9564f11d451d2e03756c85bb94d7862795fb42e4ca88925a1115b9f049a195fadf085497417468fc86fe064b92b135a758c0c2b496e78913a04792958c21b1c2b08869edf91bb1e49da0bc29be2795181a3beae847cbcf62082e4ab1024cd91177d06c8a8e8f9fc0ee041a82237129098aa409b9464cb9c53fd1a5c552d0fa49d044b9b295bbf411d52a5fa1ad1aab2f6eac992168811517da0ea1f88c2b918969fc2ed1150ed3e2c3a8dbe05d57b0daefe6885a30b297bb72ab6b6586d66364826bb958dbe8c41a1ad1b16b0820f41a48d0c76dca1ba11a0946443d024133288274424913196d29a31244e79115068fe951141ac19978fc8f4faa874f7ca3909994b077ebe0f6b3f66d9a6e2773e7e46054facd428f911440093a25088b55cbf239431399fddd8d093a9c8e6f876ec468b0868a405b99209d6d8de108dd4aeb6757e6444ed286d34dd9bea2fac3c382b0b079566372654ee8abe623b8c61e27a0cd6ad0e8b2e494983e5104ebbbe68844db8ecbfd1ec26096c2346e4ded8c95715c98fc97f168573ebd06b488170e827db47b02421f1a260a91f6090f88eec996504b0ae836d8d5d6e72254f9d3026beec3722773a7e02577d04b313f8d112363eb360a66f14ef7a9341c523eb1884b88e17b02f757b0d7c15883546e3bbd178fb52c426488da46cc57106243a9f425104e3d2d27e18bdc82644b8e3de3dbdc3a0921f9ee9e5089a1b4ff009c974956da6b67c8f47a4883495165060a4aa49cc114262ad2731874b02a1b3ebd2c48d8da13e88989a534307d9146e4eb0c4afc85847d245fa581ece3f768c2c49cfea286e4fc4a6d3faa50828f2b6eed3dcba76c7b9137e6e7bb0b0a436fc05d4aa1c56d0677efb2e26a5948839206d2c7d18f6579fbcd90d5f3d44e4968752f3a889b03c19d0a5ee89458afb4880ca7bac4cc8902a3434a09a15b5ecf23492a42588c9495d80fc1b8c46764a256a515605b5b5f024a49cd4ac489d59f609b2204dc6b4ad5154e84892a9c444c5267926a41026358625890c4137f62c2f1ea12cc8f7228a2b33bcab69233842162a1e62bf762425e7a89cd7fd1aa8684add86249aa1ecfa1934305c2d89a88913156aa236f2a9038ea0a1f713a7c078e84f58c0db8e884776cdfcab3b959edd5e83b0c85980b29fe1d46364a244f49b420db0cfabe9a69862fb04a32498896eb22679262e310924bd12751756f9bc9114a6e84fd0676c3a893d6646fedbc6741c47944b729f6b86ac18a3a8b2fc88c94c68252f26f913f2e7d6a205a142ddd3d868a4f85852848ae5bcfb8911280d744d2395d15d95b82bd08d47916df6c5a10891befd842d2921f421d50b9384bf8507f60ee34927622551918e514c14cd13e1938d10c34ac4ddedd895052ea143e6462237748b2ed642096496bba8a1c093f3553f22b95f5058399783d204a1a754c62723441046bc0c40909b13b8bfa0a061250452bc0ee12ee19f036350fb6e53250f12eebb8544b8ce92275308fe5c2f813f6090d5495ccc7f84c8c91b1355c34eb52648f802dc98818426324b143bad8b8a122aa4776dfd8d9322627d92eee7a0bca8ececf026cc6d44d51f74b9d9a27410e42738f4912a4913a68ba55745c9520fb639461aeaa47a4da2082fa2cc55ebd86ca89f1381d308a84471b93ca2c2948bee89bec87c25cfda44794a761d275c3218d9510f65e9cbd95f045dd479ac3a60b1a97bbab205a88d1fd849d1fe103e667f5a1241b4829ea8986a4c781a7fa1497f9572a146132aae5944a129b3b90a94d26eabee477658fb232d508a9486a893a49d448da4abd369e19234939b8e452f053097a04cd7723929952f33155428a14333931742e872276b59c27f4866b2352a52813e091ccd150e67fd165c688722b8d5489a0cdce94acfa8899216583acb95fb109363288fad8fa99f024b1a648aecf5ab751a890d0859c693611096fce852d2dc6b3a246d0df22e248969499eff1a210dc0d9891584220af12f0d3dd3c31786478d95c8d4ccef2dd65333bda9b38c53a0d9252229833a659dfd8b09dc72c8f46e0f425e46ee607fd12ecc41e9b62d484289a5c6d76132c4bf67e508a8c75f8315926059ed0c5f2a0a50e9b2b0b811a0f64c388a049f2db6ddd58c5ff0082d506fddee3d547507e4fec8ee77f42f42d1e44522ab221f56d0f03dc3246a694a5b7fbc3144a4dcaeaa528e3b0a4c296c9e83a8b6213aec29e89c5189782c93939075929dfb4fe3f050e35553a9cc333c1039626b06a51fc8894a23250af92b0aa1373116f923aa9174ea3e958a853b4587b374970b0f09774df31b89d3cf7d132589f141b25ec75b8cf0abec2ba5548b2d84d24617250be3a8d2542be1b724c4c9ce8c6684a39236194992e31f32fc93a378260fb3dfa959d5f8565ec86b35a2fe34492440e81a556ff0023451168fbfc684c4c924b82094112368922e9a9fc8437cd48ced7e0806c9131317627631ee1b15b06b9434244c9baa94ee7743ec45d313424babb088d13d104f4b0c3e871c5899224e9524cdc9b0282e636b0e9881c5088c264923551248aa0daa1940d56d3f039d9123d18d28268b41a87de8b87e46aa494790cc41c88562cac2e35660aba4dc3dd5437d8ece65b704fac62af62bdf07ec6ed26a34d53eb1a2a46e418950b5b908295622c2c4d64462f43d0d98ada06acc1cac153fe65c955575a54b778c96f1e1cf3ca509b7a246e251412997921d886ea4381ce57510366ec951d7d86a10ae40aa16f2bb40d9675261c6e648150b1a17720d3da1f3519e33c8da3e495ee26ac6a84a9744fcc8d8ea36273a646c91283a434e8a14be49249d246262622042741d07305bece8ff1a1345716acc12c820cc01899c666699622d89d098968842d0e25a5871c091924ad1a172248484b49d0dc4e27dc913128d09bd4ded0d9845ac7a7789d11917ba8a1a66e9cc3a2c34b2e4de851d6722d655596f8b06f4aa2b848ee496a5f29945912b1476d82e0d9175d8d61f8246dcff08d49fe425026330994dc652a4767c9ba4c64151c48ff002c99ba9c3b3e83f9008ae0a27bfb8b7d220c04d24dd98d902a41391e6e417a12516ff230de46db5e345b8e7623c95a8ce479aee64b8489e0c77924889f20f492e52eb5f18449352226263648c6a788140e85f768b5492216864e8679cdfdaa26864898832190a8e4285d90ecda0cd8917189244fd2186132a4b187131c7b15b5bd85352f813b0d50f80a5818820648b46892a4b274489bd04c8f030e82d18c1633715f693869a8b983d86a457cf049b73b9463eca76ea42ad5257f226952a46f989233605e45c8f931d60f743d2df53a453e07915fb535d884650649ed181ad0a832ad9c08562d3b25d9f227c211a33f23d560505d93d9e9381313ab9222c455ec2f332f04e04bf024fd58484f44938c086a684437446076083ec37586644cb1eaa99d91d96890fbd2ae764aad89770bcc5b47a4883622f81aa5227a1610968843648e021313249d524a69e67dce0fde1e84d186d428f3aaa0ca4656202b13d86724316827a26262430c289c0d238d62b9c8bd390f66d17b0d9e6e1d87c111e51e44c37f34decca6f59a3ca179fdaf910b2c9ae1a6bd862d4a13a2514d204410411a8d7645f84523aa6a2988b1ccaf021524a22ab61b6386692ed3349b15ea93a767841882a50edc91ed36ea56604de4e9ec549353cdefdd41d42552aeea83bb87d24b21f90aa90aea689bcbb0d772f948cb240adbde2fca2543ca411c9124104d06b0858e9e056e4989139b5568de9227819192d0344608f1a35a4e35bc99c4a75b850f9547520d18b376bb35545e58a792464eb489899248816897fa492264e8c61317a01893823a5e8d48d8835a30da9bf45c616856c9968911a2648b448989bd0c4c96c2c0c3d11524c62bdb920c897ae527b8bbae2fd4944d7009ecd6042f2eafc8ce4760a67f1e74930cfa7decfcbc13d0ba6c299d3c5fcc279e8c3f61a34647a8a12493a41047a036d13dddd7e0fa567a9454251fd287acbdcfb930952eb5154de011233588ceae80def61bca442a24e082431c396b36a116bdcee4aa7710255fa22097dd882e4c184cadfec1cfd81b1396946491099724586c7ec2591481b81aa09f91c57dac909c1cf0fdc4a4d3c331a6ae64770b25599c6ddc6f6be07a3627a31aa73169b4b4878d022491689922649248c2763855775fa31e8d10208483b615e06b18eae84361968afc142aa0525a48dfa08427c0c243138174311c2ea4d04569d2740fe455139fc76d7fa84570ce3f71712a854fcd6517982ebbab7d4a5826287950fd8c65d206cde86bc95295ca1fb166dde9ee2e8d749487be44d8207be697b00caa5ed32f0ceefb8b428264922627a24410398f98dc132854d8526c988b5e83e457dcfba1bd8247043fbd435b4741d3aa1dfc0698a592e8751d7cbe5741394ffba6286e2748d095a3a9146d7d42702188ca1d5cbbfe8ccec353f6c5524e3438c51a879c68551ae09cdb19d14487de2a13b2974dc915bfc8de49244c91b1b227868487a3aa3da2d246c4c4c4c9249249212a3d5bc6f37e193da8933e98751cc9eab11ee92e6e0b1b364b0b81bd0ba3b2212aa11247e0595142c8daeca91d0de09695728574e45928964910613131042630e389899247681a9a8a03773bc1d04a47ef187d0b6a28450e6e8f66604e44b577d1d5d9f239b17cbedd0d9258d7767c64d48dc7d999c7d4bf4551798abf4665ec3ef6109e5059adf307b20f7924be0ca7cdda6e09ad997249eda56813132745e963b11365c1b6d1bf039dc7b46c86dbb2dfb4230362541b2c426dac0d4129c4d8cd6c2bc1172610c672e31f044244d586a4110219635b7229038c57d78f2cabb1fc1b04e23e712f088522657d8109d13249d1ad18f6a163a2132462d16a61e967762f232653e5beaabec37490d5401bba9ce4b893315ae83249168dd1ea25aaa9103f13e37ea5395f5084ade445c32095f6c4a89fe8cd28916890da33b8827a1861f438258d66f792d09922106744eaa8c32fd84a6cc7ba9c96453da05bc8c8b62c9e570c7251737aa579b9d849b4d4d4ca8732afac8c92cc8ee6f1eb033f4dcb826bdcfce94f91a4b0e7f8323546588bec1f1f4fe0c9b4add7ed6840cbb7d4683dda93f12244c4c5aa5a410409ba7e4c509e69f246da1f1133972262b11a2c3ea5a483ea37393ae89698d7be911dc706648209a8b2f7f83163635bbf81c9134b813813188d3fd99fe1427d5e9364e92363098dd274f8968989e8b44381428ef041bb6c97477de4f8201d996c7b14d0c8fe8c6ac25616425c9d1884e0905e5886a8e4b6ac5d1aa8d428fd0aa87977fe0db31869244c229862743ce94369b8628ab24e8492498c4a4492dd604fda0496e4d6395dc82dd9c6ede3c94ed886f23694a508dc45b32cd9455616432ab82b2a39b01af54e9232c6d19cfb333927ec3f635ee3f140e55363d9e9cbc31b49b3fef03e84bdc7bd7d3ef222e967863f107b79b9f899113e9babbb19725b26e0b62a43f649b7d81b6342e8554b20870a7f4534f540b549d04e59fd2ca8c81c647db6b24565477a8afd06c924fa125d46a11628249d5b244e47164a7542a09c9c681ed0a1e8238aeddaee1b3693737b033260d3388cfd08439ba5b270335485f08813f58de1248855311dec58286b22a28e848a04c4f430da2ac12360927495e6eb827f049524b785bf25d90a501cd758366e5b973386b2e81cc30a7bce4ba1d548afd876f83ea86f6ee7509521812dd378dba070f4c92492493a13ac96c7f946f415fa4cb6d762d848768237b425e2609da4dbdc5a143ea201e59157e4656f0bdd40f1c153c362965926e9a6bcaf437e08a8da430cc9a41622d98b09c60525d5868b313582609c8f71704b636ac4c510714a4664774f9782e62a732e28fce049bb7d6436457743b187d09898cac9744871b4ad9248881e3bba05589ddcf6baa97ec65cc6cca9cb63ee1bf44a108f54861c618e884bababcbfc134275128d84c5e8142430836b311291ae64435491a2a5d78426b51941e8a9910a9b41af2dc45caf70b5b8f02569ecb495430fc9133151ea2d9a62cab74cb7e1c1507b5f1596af55dca1d599499a5cf187a130e1f64c3d1040fd13ac924eadb07470641f22574dec2b22e9519bbf419546bba12bd9fb9577fcefb32d8af0f75a0b76f1f01a0a37681ed20855a9f0d0993a3d869d0b743776c54489917d1d21ee27f231ce8f46fc177c6059b0903485748766e3caf6637510f525d5b613a193ba962bb78d0fae06c4e5898f69248e31f033110969fd0d2b77129175abfc1d87dca2243648dead88804f4111a40914dcad768a28ac8951a484b96406e48372ea4e99131c4f4210989686244cc2363e9302094e498d1ec24c2c5c65912d8c092424a4afbb3b93aba980e6fe47a8431ba38f23d957425199b1d8f13536923d43ecbafe4a89f8d8b454c538bb7c4dda08d68f4827d12493ac93a275d3b2bbb376f54999ecf28459fdd35ee35f88e09b409e88243dc9b3d12d8a0623491a227b68d19f1e86e28c7d8e46bf6fc8d4b0c5ccf41b1252399f97243ead90dc5343924c0cd8f464c7daa29f9241ec08e7f8817e4c49d47877b0ec3e72d0f9bbe5dc49237e84b42692d4b4823448521c450d91ad23696a86b02494098da53d09082621c4cb07c8d92689527520f4e68226a369258d66c8ef0946b5208d4bee4a7c8a24b05c57ae2a863ee508caa35adff825626a0daa74e872a65aa3b80c2db43d9647ba12fec09cc50411a3d5e922249249249249132744922e557f04520eba277911230e256a37b0c4f4bba088649248da3574b9115da7e495636aae46e0653d77d138e5288eee6cb9290ba3cc151308448d97c0c36488ba04ce1ec956e12fc8ed982f7bba3b07ba52d29f52a4b7b93a47a648d04d589d0847a4188fa991a744923a10613d0b4413131bd013097b6c4a4d30d90253a1a896d5b6c2454b6a56b76524a85c89915ca948a0c9ba8b1b0b52e935ea561d4823a25cc93dca9d444a70f285b1d277bdf22f641942dc2fb52b036e1ad5ea88d169047a67491a97e3ead634642204651035812c693482604c95a4883d56742f27e2a4fef5f7c90812a5055e65e5b2a3c559322d196aea16cabe5d91477915ead84ccc932ab1bf5424647ae05104207a10c242090908d04651d0503ac7a123083694104842648b50d8c34338263903d96fe68855d182b0a925ec4905a448e4b86e46e84d4abde9fe93ceb394d8a0b7f78abb889d21c87557110d14b40b4b57830b003060bf2b9cd5a04a731812c95ddc390910c6bfe4ff00e1cb2748ae874d1a826ad912246c7462d605a21b18f5d0a9340b5bc6223ba1c28435f6ba2328dd1ac29752858964a93d1918592bf9761ee530df5fe07b4b36e6ba2deb1ff15144468427a8a223420baba617a713fa2a10b44c4c62741e9b25718e249db7562092442853c055d04b790f41150c18d430f82485318f41b18bb3a325129eecc722299b7b8886453b5909b0dc950eea4086c1ed02bba6ce7e4a5d982871b8f629ab89d1c91a469047fce704d6081359226e466749f4a47a3621885f84aec843814250b6b14d5e0af33296ef23a4dd5bbe59239d3826ab2760ce3ee07b1394bbbefc8a9a4e91d5b4933642fee9b76592789b189f4c93eb810410686b44c6105d09090de8c53244f4263fa9099248b44e47cc68959ed3e07ed8d1722c13a093a84414b182a0c639b8987a8c3647af3622e4c938748c54b2189629c8893a55b1cc249889c48b549cc320d2d7db084918ee4f3ba1baa5a859989d865a193e87ff000cbc381aa6ed604a7a8c4e894e49247a4e8d91a48e38a92b1cf7a911ac3b71294c976bb6dc024dc10ceedb6fb8f1a1b9229b63ebc93d5e05b46464ff00d508209e82d0fa54488121e3d5ae98c38a2eb26264924e9ad057c2dee54118968d169aadc7826a69b32f1a16ba1e9245a924496533688ccb6528853ad45a1d12f72e1745cbded572da961bf204be20b91da5e2ad2ef8ee55d17d10bf2379d123b546c772ddfc9fc0f486d727469ecc7e96d7ff008312ae8b04891020c71b68d93e89d123274b606724d251d4695ab336ef089d188d5b133c3f03227ec1b9fde070cafe6e43355f8f618edb96f9a8c3d1fa9ffc10f81346318843fa62185a956a161c4d0daa491322189b54fa8f5b0bde563d21182522220c952142d39aea0821862492492484cb1944f81a944130e46ede7f03554be0e45d56ac439dc4cdab797c122a5725771c8fe3fa34fd11b25bda5e0c3291f87a1491d0bbb7282cd90fa1ecfae8d68caa590493ea6e46c8a9043d132344f49f467d0d923534a4098b32f65ac89ec5d52560d8e05552ff002171a2d8deac8d6347eb62636a6343d10fae911a242627a282636bb0c30c4e89137b811b4d3c61fb8df40f18209128fa470420701b920498e8d14f423430c37ac93a16a86a57a7b490dcc5b9232ffa283f223844b15a2b3d88c93fc12e74f9647a873556c32ca31c07476ec40eeb29fb5d4c895ad17b195ca80f6e85743bafd0f669d1abee9904924fa2754e82be8448c3124e93e98d1a1281863d2e353ea3d206bb9552ce9bdbd47f62f9ae7c6c3d123f44e89ff3444d31a6be9816b2090911ea5946d671c6d06a34dc40e66eb4cc906fcf1b7084f5191686c9041a9ae4922246c6c44fa1693c09e2e3ed324ac991af2dc2f736429387d4844ee617fa20e09c51922079c88172495ea5cbcb68198d9c0c6a195305f6724fb0b78187c8f6f32f1d53cad27d72254108ff008413ab2443d1dc7a3eb8d34efaa8f5975d09c388c8a6676ea18edaaeeea363f5a4243245ea8d20475e5abd10b4bea4103d249d0c471f43e831159214fb89c4d37a0f4d36c6b495a0f4224a3413d1f3ab63124e90468843efa6a2e6b89c97d91e783f23c49f0b744e4497e841f9fc705241f22f610d0a31acef021a2b44da0f3288fbcd79cd74e8219c43f41d8c73c416bdb63e6c35a40f57a7f3d13ea9193a3d249d10d0f0665c49c237a24b5d50f3b20314ac75fc14dd9aeb9648dfad2206c9ff008493a23bb68c8d10b5db4a20418d9238c368710824b625a2ded5327953ddd58de5a724e924e8b7e891bd1498197a16af49d124e89095283783422e32f60c04095876239528f0289b745a6a54955f81aa0497190c5d2aa570bf764811ecf71f76c70b64ba89d9209aa8c5b6c363578d46411a493e9820436492413a24440c91bd27428f71aa48b96a6872255bc470ab3ee348b5910dea968dff00c58bd02e277d58b5b8da168f438dfa2c48aba114fa86d82e0c9244f4b0fd4636208627d1237a27d290916e8ca4890b0b772873419dd119d59f55876d41eeafe474d1cedd042b14f714a0995372e15222f4ec4349b53e49ec8859769b9687d877315188f79b07c3caad7d2a2357d1924e8dfa13246c6168de9146feb7a4e8fd235082a46d57a8878d55329a4b2f9f546a831bff008c7a9af28426881248e38e3d05e93ac22af1a174aa9434e17865518fad743636492493a493a2d4c4b491bd1123637ff2187abc15d14943a94b8abe2e5f5464a31f2fda4a4f1c283690de4bc91489c88969a24ea51c62381aae71bc8925555713b2d766a793c516a3fd145ad436a7298ed25bfe20c5a469b434e8e76640f4951eebe2fa25aad489d1ad246c92749246c71cb59523e5e07a535d06fd33a25a37acff00cd10488b3d332773782564e413ba179395e80cdacb19be9248836adc13aad124ea81092755a4fa27d284c9249d132e43d28c7389bf8189437c8c486e1b50d6dc9010a16c2e24cc264951ee21d09aae1c92a329b2a217621257c0fd0e2bee4480bb30bcefdcbb24f8471fad4db924fa13f4b64924fa58cfcc62dfb73b4c7c0f4b281ea3f43d50c6ff00e91ea7e913dce627b93df52491b27448dfa124fa193a47a9fa1327fe7240f55a93642aa2c3b429b4eae07ddfa40881d32e884ee8b7775c04d1fe0f701b9c0a6f7d310a76638286ddc4f3622694c91ae5f103527c4f73a7db06b0d08223d322d168f49244413a30e3e95aedcf94ab23701b7efa2d741bd69a37ff00662ffbc93a49249249237abf4a1bd56924ff00ea59d2aa6ea35b9b11210376237f0bc0f7664856e60569c8d81b74f243ac31d41915284d08e25430d19115e8ff003e96b4813f431ad10891af813a255bae0286c42f24d0aec4b1b78eecbb8d284d8c3f52086f58ff00a411ff0049d249ff00ca9ffe7213249d2d904a1d28754168d98f2303f43aaa065947911c1b82f1b512270e044fd811f6625c8523195a5e71a594fd2f4912d607a49924b0ef985389afb0d5648da5e1743ec26544caea77898d20782430fd490fff00c647a1eb6a85b9c0a06d27a874d3b0ee887849254ad7910a3812e89eec4229f9a0a94a63d91121b427492a30c55a8f942eb2b1ffd9	2026-09-11 22:04:40.446+08
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, password, role, first_name, middle_name, last_name, suffix, birthday, gender, phone, address, city, province, zip_code, school, course, year_graduated, highest_education, avatar, avatar_url, batch_id, exam_id, program_id, major_id, school_id, academic_course_id, job_role_description, lept_major_id, examinee_status, diagnostic_score, personal_target_score, font_preference, created_at, last_login_at, login_count, targets, personal_email, is_active, subscription_end_date, login_prefix, login_number, login_id, target_exam, target_exam_date, status) FROM stdin;
2	Richard Gutierrez	gutierrez00002@peak.edu.ph	$2b$10$s1LGI3qvhIngun40Oe3iUunnVfpGjROmzHSXRiF.uVdbmKX3AxxQ6	super_admin	Richard	\N	Gutierrez	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Full system access and master controls across all features	\N	\N	\N	\N	geist	2026-10-20 15:24:18.36664+08	2026-10-20 15:26:37.512659+08	1	[]	gutierrez00002@peak.edu.ph	t	\N	gutierrez	00002	gutierrez00002	\N	\N	active
1	Trisha Samson	christinasamson@email.com	$2b$10$zyrzb/7iICd63QRICDvozuw4G.7alQ9yW67BeT.t25K.LCK6fdBGy	super_admin	Trisha	\N	Samson	\N	1990-11-01	female	1231231234	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	geist	2026-09-11 16:31:05.297+08	2026-10-20 15:51:51.522429+08	2	\N	christinasamson@email.com	t	\N	superadmin	00001	superadmin00001	General	\N	active
\.


--
-- Name: academic_courses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.academic_courses_id_seq', 2, true);


--
-- Name: assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assignments_id_seq', 1, false);


--
-- Name: batches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.batches_id_seq', 5, true);


--
-- Name: carousel_slides_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.carousel_slides_id_seq', 4, true);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 4, true);


--
-- Name: custom_roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.custom_roles_id_seq', 7, true);


--
-- Name: daily_registration_stats_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.daily_registration_stats_id_seq', 922, true);


--
-- Name: daily_student_stats_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.daily_student_stats_id_seq', 1, false);


--
-- Name: examinations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.examinations_id_seq', 5, true);


--
-- Name: gradebooks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.gradebooks_id_seq', 1, true);


--
-- Name: majors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.majors_id_seq', 3, true);


--
-- Name: mock_exam_scores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.mock_exam_scores_id_seq', 1, false);


--
-- Name: mock_exam_targets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.mock_exam_targets_id_seq', 1, false);


--
-- Name: mock_exams_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.mock_exams_id_seq', 2, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 4, true);


--
-- Name: pre_registrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pre_registrations_id_seq', 1, false);


--
-- Name: programs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.programs_id_seq', 7, true);


--
-- Name: schools_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.schools_id_seq', 3, true);


--
-- Name: security_audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.security_audit_logs_id_seq', 5, true);


--
-- Name: student_activities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.student_activities_id_seq', 105, true);


--
-- Name: student_calendar_notes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.student_calendar_notes_id_seq', 2, true);


--
-- Name: student_quiz_submissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.student_quiz_submissions_id_seq', 1, false);


--
-- Name: student_subject_progress_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.student_subject_progress_id_seq', 29, true);


--
-- Name: student_subjects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.student_subjects_id_seq', 1, false);


--
-- Name: study_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.study_sessions_id_seq', 1, false);


--
-- Name: subcategories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.subcategories_id_seq', 2, true);


--
-- Name: subject_contents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.subject_contents_id_seq', 3, true);


--
-- Name: subject_modules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.subject_modules_id_seq', 1, true);


--
-- Name: subjects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.subjects_id_seq', 1, true);


--
-- Name: submissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.submissions_id_seq', 1, false);


--
-- Name: trash_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.trash_items_id_seq', 17, true);


--
-- Name: uploaded_files_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.uploaded_files_id_seq', 1, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- Name: academic_courses academic_courses_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.academic_courses
    ADD CONSTRAINT academic_courses_name_key UNIQUE (name);


--
-- Name: academic_courses academic_courses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.academic_courses
    ADD CONSTRAINT academic_courses_pkey PRIMARY KEY (id);


--
-- Name: assignments assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_pkey PRIMARY KEY (id);


--
-- Name: batches batches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.batches
    ADD CONSTRAINT batches_pkey PRIMARY KEY (id);


--
-- Name: carousel_slides carousel_slides_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carousel_slides
    ADD CONSTRAINT carousel_slides_pkey PRIMARY KEY (id);


--
-- Name: categories categories_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: custom_roles custom_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.custom_roles
    ADD CONSTRAINT custom_roles_pkey PRIMARY KEY (id);


--
-- Name: custom_roles custom_roles_role_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.custom_roles
    ADD CONSTRAINT custom_roles_role_key_key UNIQUE (role_key);


--
-- Name: daily_registration_stats daily_registration_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_registration_stats
    ADD CONSTRAINT daily_registration_stats_pkey PRIMARY KEY (id);


--
-- Name: daily_student_stats daily_student_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_student_stats
    ADD CONSTRAINT daily_student_stats_pkey PRIMARY KEY (id);


--
-- Name: examinations examinations_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.examinations
    ADD CONSTRAINT examinations_name_key UNIQUE (name);


--
-- Name: examinations examinations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.examinations
    ADD CONSTRAINT examinations_pkey PRIMARY KEY (id);


--
-- Name: gradebooks gradebooks_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gradebooks
    ADD CONSTRAINT gradebooks_code_key UNIQUE (code);


--
-- Name: gradebooks gradebooks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gradebooks
    ADD CONSTRAINT gradebooks_pkey PRIMARY KEY (id);


--
-- Name: majors majors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.majors
    ADD CONSTRAINT majors_pkey PRIMARY KEY (id);


--
-- Name: mock_exam_scores mock_exam_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mock_exam_scores
    ADD CONSTRAINT mock_exam_scores_pkey PRIMARY KEY (id);


--
-- Name: mock_exam_scores mock_exam_scores_student_id_mock_exam_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mock_exam_scores
    ADD CONSTRAINT mock_exam_scores_student_id_mock_exam_id_key UNIQUE (student_id, mock_exam_id);


--
-- Name: mock_exam_targets mock_exam_targets_mock_exam_id_batch_id_program_id_major_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mock_exam_targets
    ADD CONSTRAINT mock_exam_targets_mock_exam_id_batch_id_program_id_major_id_key UNIQUE (mock_exam_id, batch_id, program_id, major_id);


--
-- Name: mock_exam_targets mock_exam_targets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mock_exam_targets
    ADD CONSTRAINT mock_exam_targets_pkey PRIMARY KEY (id);


--
-- Name: mock_exams mock_exams_exam_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mock_exams
    ADD CONSTRAINT mock_exams_exam_code_key UNIQUE (exam_code);


--
-- Name: mock_exams mock_exams_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mock_exams
    ADD CONSTRAINT mock_exams_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: pre_registrations pre_registrations_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pre_registrations
    ADD CONSTRAINT pre_registrations_email_key UNIQUE (email);


--
-- Name: pre_registrations pre_registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pre_registrations
    ADD CONSTRAINT pre_registrations_pkey PRIMARY KEY (id);


--
-- Name: programs programs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.programs
    ADD CONSTRAINT programs_pkey PRIMARY KEY (id);


--
-- Name: schools schools_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schools
    ADD CONSTRAINT schools_name_key UNIQUE (name);


--
-- Name: schools schools_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schools
    ADD CONSTRAINT schools_pkey PRIMARY KEY (id);


--
-- Name: security_audit_logs security_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.security_audit_logs
    ADD CONSTRAINT security_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: student_activities student_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_activities
    ADD CONSTRAINT student_activities_pkey PRIMARY KEY (id);


--
-- Name: student_calendar_notes student_calendar_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_calendar_notes
    ADD CONSTRAINT student_calendar_notes_pkey PRIMARY KEY (id);


--
-- Name: student_quiz_submissions student_quiz_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_quiz_submissions
    ADD CONSTRAINT student_quiz_submissions_pkey PRIMARY KEY (id);


--
-- Name: student_quiz_submissions student_quiz_submissions_student_id_content_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_quiz_submissions
    ADD CONSTRAINT student_quiz_submissions_student_id_content_id_key UNIQUE (student_id, content_id);


--
-- Name: student_subject_progress student_subject_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_subject_progress
    ADD CONSTRAINT student_subject_progress_pkey PRIMARY KEY (id);


--
-- Name: student_subjects student_subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_subjects
    ADD CONSTRAINT student_subjects_pkey PRIMARY KEY (id);


--
-- Name: student_subjects student_subjects_student_id_subject_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_subjects
    ADD CONSTRAINT student_subjects_student_id_subject_id_key UNIQUE (student_id, subject_id);


--
-- Name: study_sessions study_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.study_sessions
    ADD CONSTRAINT study_sessions_pkey PRIMARY KEY (id);


--
-- Name: subcategories subcategories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subcategories
    ADD CONSTRAINT subcategories_pkey PRIMARY KEY (id);


--
-- Name: subject_contents subject_contents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subject_contents
    ADD CONSTRAINT subject_contents_pkey PRIMARY KEY (id);


--
-- Name: subject_modules subject_modules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subject_modules
    ADD CONSTRAINT subject_modules_pkey PRIMARY KEY (id);


--
-- Name: subjects subjects_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_code_key UNIQUE (code);


--
-- Name: subjects subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_pkey PRIMARY KEY (id);


--
-- Name: submissions submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_pkey PRIMARY KEY (id);


--
-- Name: system_security_settings system_security_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_security_settings
    ADD CONSTRAINT system_security_settings_pkey PRIMARY KEY (id);


--
-- Name: trash_items trash_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trash_items
    ADD CONSTRAINT trash_items_pkey PRIMARY KEY (id);


--
-- Name: uploaded_files uploaded_files_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.uploaded_files
    ADD CONSTRAINT uploaded_files_pkey PRIMARY KEY (id);


--
-- Name: student_subject_progress uq_student_subject; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_subject_progress
    ADD CONSTRAINT uq_student_subject UNIQUE (student_id, subject_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_assignments_teacher; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assignments_teacher ON public.assignments USING btree (teacher_id);


--
-- Name: idx_batches_exam; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_batches_exam ON public.batches USING btree (exam_id);


--
-- Name: idx_daily_reg_stats_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_daily_reg_stats_date ON public.daily_registration_stats USING btree (date);


--
-- Name: idx_daily_reg_stats_exam; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_daily_reg_stats_exam ON public.daily_registration_stats USING btree (exam_type);


--
-- Name: idx_daily_reg_stats_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_daily_reg_stats_unique ON public.daily_registration_stats USING btree (date, exam_type, COALESCE(batch_id, 0));


--
-- Name: idx_daily_student_stats_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_daily_student_stats_date ON public.daily_student_stats USING btree (stat_date);


--
-- Name: idx_daily_student_stats_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_daily_student_stats_unique ON public.daily_student_stats USING btree (stat_date, user_id, COALESCE(subject_id, 0));


--
-- Name: idx_gradebooks_batch_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_gradebooks_batch_id ON public.gradebooks USING btree (batch_id);


--
-- Name: idx_gradebooks_exam_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_gradebooks_exam_id ON public.gradebooks USING btree (exam_id);


--
-- Name: idx_majors_program; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_majors_program ON public.majors USING btree (program_id);


--
-- Name: idx_mock_exam_scores_exam; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mock_exam_scores_exam ON public.mock_exam_scores USING btree (mock_exam_id);


--
-- Name: idx_mock_exam_scores_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mock_exam_scores_student ON public.mock_exam_scores USING btree (student_id);


--
-- Name: idx_mock_exam_targets_exam; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mock_exam_targets_exam ON public.mock_exam_targets USING btree (mock_exam_id);


--
-- Name: idx_mock_exams_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_mock_exams_code ON public.mock_exams USING btree (exam_code);


--
-- Name: idx_notifications_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_student ON public.notifications USING btree (student_id);


--
-- Name: idx_programs_exam; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_programs_exam ON public.programs USING btree (exam_id);


--
-- Name: idx_student_activities_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_activities_student ON public.student_activities USING btree (student_id);


--
-- Name: idx_student_calendar_notes_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_calendar_notes_date ON public.student_calendar_notes USING btree (event_date);


--
-- Name: idx_student_calendar_notes_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_calendar_notes_student ON public.student_calendar_notes USING btree (student_id);


--
-- Name: idx_student_quiz_submissions_content; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_quiz_submissions_content ON public.student_quiz_submissions USING btree (content_id);


--
-- Name: idx_student_quiz_submissions_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_quiz_submissions_student ON public.student_quiz_submissions USING btree (student_id);


--
-- Name: idx_student_subject_progress_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_subject_progress_student ON public.student_subject_progress USING btree (student_id);


--
-- Name: idx_student_subject_progress_subject; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_subject_progress_subject ON public.student_subject_progress USING btree (subject_id);


--
-- Name: idx_student_subjects_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_subjects_student ON public.student_subjects USING btree (student_id);


--
-- Name: idx_study_sessions_subject; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_study_sessions_subject ON public.study_sessions USING btree (subject_id);


--
-- Name: idx_study_sessions_user_start; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_study_sessions_user_start ON public.study_sessions USING btree (user_id, session_start);


--
-- Name: idx_subcategories_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subcategories_category ON public.subcategories USING btree (category_id);


--
-- Name: idx_subject_contents_module; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subject_contents_module ON public.subject_contents USING btree (module_id);


--
-- Name: idx_subject_modules_subject; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subject_modules_subject ON public.subject_modules USING btree (subject_id);


--
-- Name: idx_subjects_category_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subjects_category_id ON public.subjects USING btree (category_id);


--
-- Name: idx_subjects_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subjects_code ON public.subjects USING btree (code);


--
-- Name: idx_subjects_subcategory_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subjects_subcategory_id ON public.subjects USING btree (subcategory_id);


--
-- Name: idx_submissions_assignment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_submissions_assignment ON public.submissions USING btree (assignment_id);


--
-- Name: idx_submissions_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_submissions_status ON public.submissions USING btree (status);


--
-- Name: idx_submissions_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_submissions_student ON public.submissions USING btree (student_id);


--
-- Name: idx_trash_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_trash_deleted_at ON public.trash_items USING btree (deleted_at DESC);


--
-- Name: idx_trash_entity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_trash_entity ON public.trash_items USING btree (entity_type);


--
-- Name: idx_users_academic_course_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_academic_course_id ON public.users USING btree (academic_course_id);


--
-- Name: idx_users_batch_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_batch_id ON public.users USING btree (batch_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_exam_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_exam_id ON public.users USING btree (exam_id);


--
-- Name: idx_users_login_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_users_login_id_unique ON public.users USING btree (lower((login_id)::text));


--
-- Name: idx_users_login_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_login_number ON public.users USING btree (login_number);


--
-- Name: idx_users_major_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_major_id ON public.users USING btree (major_id);


--
-- Name: idx_users_program_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_program_id ON public.users USING btree (program_id);


--
-- Name: idx_users_school_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_school_id ON public.users USING btree (school_id);


--
-- Name: mock_exam_scores_student_mock_exam_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX mock_exam_scores_student_mock_exam_unique ON public.mock_exam_scores USING btree (student_id, mock_exam_id);


--
-- Name: pre_registrations_email_unique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX pre_registrations_email_unique_idx ON public.pre_registrations USING btree (email);


--
-- Name: assignments assignments_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: batches batches_exam_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.batches
    ADD CONSTRAINT batches_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.examinations(id) ON DELETE CASCADE;


--
-- Name: daily_student_stats daily_student_stats_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_student_stats
    ADD CONSTRAINT daily_student_stats_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE SET NULL;


--
-- Name: daily_student_stats daily_student_stats_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_student_stats
    ADD CONSTRAINT daily_student_stats_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: gradebooks gradebooks_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gradebooks
    ADD CONSTRAINT gradebooks_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.batches(id) ON DELETE CASCADE;


--
-- Name: gradebooks gradebooks_exam_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gradebooks
    ADD CONSTRAINT gradebooks_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.examinations(id) ON DELETE CASCADE;


--
-- Name: majors majors_program_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.majors
    ADD CONSTRAINT majors_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE CASCADE;


--
-- Name: mock_exam_scores mock_exam_scores_mock_exam_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mock_exam_scores
    ADD CONSTRAINT mock_exam_scores_mock_exam_id_fkey FOREIGN KEY (mock_exam_id) REFERENCES public.mock_exams(id) ON DELETE CASCADE;


--
-- Name: mock_exam_scores mock_exam_scores_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mock_exam_scores
    ADD CONSTRAINT mock_exam_scores_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: mock_exam_targets mock_exam_targets_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mock_exam_targets
    ADD CONSTRAINT mock_exam_targets_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.batches(id) ON DELETE CASCADE;


--
-- Name: mock_exam_targets mock_exam_targets_major_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mock_exam_targets
    ADD CONSTRAINT mock_exam_targets_major_id_fkey FOREIGN KEY (major_id) REFERENCES public.majors(id) ON DELETE CASCADE;


--
-- Name: mock_exam_targets mock_exam_targets_mock_exam_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mock_exam_targets
    ADD CONSTRAINT mock_exam_targets_mock_exam_id_fkey FOREIGN KEY (mock_exam_id) REFERENCES public.mock_exams(id) ON DELETE CASCADE;


--
-- Name: mock_exam_targets mock_exam_targets_program_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mock_exam_targets
    ADD CONSTRAINT mock_exam_targets_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE CASCADE;


--
-- Name: mock_exams mock_exams_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mock_exams
    ADD CONSTRAINT mock_exams_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: notifications notifications_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: pre_registrations pre_registrations_academic_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pre_registrations
    ADD CONSTRAINT pre_registrations_academic_course_id_fkey FOREIGN KEY (academic_course_id) REFERENCES public.academic_courses(id) ON DELETE SET NULL;


--
-- Name: pre_registrations pre_registrations_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pre_registrations
    ADD CONSTRAINT pre_registrations_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.batches(id) ON DELETE SET NULL;


--
-- Name: pre_registrations pre_registrations_exam_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pre_registrations
    ADD CONSTRAINT pre_registrations_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.examinations(id) ON DELETE SET NULL;


--
-- Name: pre_registrations pre_registrations_major_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pre_registrations
    ADD CONSTRAINT pre_registrations_major_id_fkey FOREIGN KEY (major_id) REFERENCES public.majors(id) ON DELETE SET NULL;


--
-- Name: pre_registrations pre_registrations_program_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pre_registrations
    ADD CONSTRAINT pre_registrations_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE SET NULL;


--
-- Name: pre_registrations pre_registrations_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pre_registrations
    ADD CONSTRAINT pre_registrations_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: pre_registrations pre_registrations_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pre_registrations
    ADD CONSTRAINT pre_registrations_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE SET NULL;


--
-- Name: programs programs_exam_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.programs
    ADD CONSTRAINT programs_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.examinations(id) ON DELETE CASCADE;


--
-- Name: student_activities student_activities_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_activities
    ADD CONSTRAINT student_activities_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: student_calendar_notes student_calendar_notes_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_calendar_notes
    ADD CONSTRAINT student_calendar_notes_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: student_quiz_submissions student_quiz_submissions_content_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_quiz_submissions
    ADD CONSTRAINT student_quiz_submissions_content_id_fkey FOREIGN KEY (content_id) REFERENCES public.subject_contents(id) ON DELETE CASCADE;


--
-- Name: student_quiz_submissions student_quiz_submissions_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_quiz_submissions
    ADD CONSTRAINT student_quiz_submissions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: student_subject_progress student_subject_progress_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_subject_progress
    ADD CONSTRAINT student_subject_progress_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: student_subject_progress student_subject_progress_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_subject_progress
    ADD CONSTRAINT student_subject_progress_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;


--
-- Name: student_subjects student_subjects_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_subjects
    ADD CONSTRAINT student_subjects_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: student_subjects student_subjects_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_subjects
    ADD CONSTRAINT student_subjects_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;


--
-- Name: study_sessions study_sessions_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.study_sessions
    ADD CONSTRAINT study_sessions_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE SET NULL;


--
-- Name: study_sessions study_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.study_sessions
    ADD CONSTRAINT study_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: subcategories subcategories_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subcategories
    ADD CONSTRAINT subcategories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: subject_contents subject_contents_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subject_contents
    ADD CONSTRAINT subject_contents_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.subject_modules(id) ON DELETE CASCADE;


--
-- Name: subject_modules subject_modules_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subject_modules
    ADD CONSTRAINT subject_modules_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;


--
-- Name: subjects subjects_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: subjects subjects_subcategory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES public.subcategories(id) ON DELETE CASCADE;


--
-- Name: submissions submissions_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.assignments(id) ON DELETE CASCADE;


--
-- Name: submissions submissions_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_academic_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_academic_course_id_fkey FOREIGN KEY (academic_course_id) REFERENCES public.academic_courses(id) ON DELETE SET NULL;


--
-- Name: users users_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.batches(id) ON DELETE SET NULL;


--
-- Name: users users_exam_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.examinations(id) ON DELETE SET NULL;


--
-- Name: users users_major_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_major_id_fkey FOREIGN KEY (major_id) REFERENCES public.majors(id) ON DELETE SET NULL;


--
-- Name: users users_program_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE SET NULL;


--
-- Name: users users_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict YK9Hsu6acqOYogWrw3LxjK1Rf0ZnBe2ehMnBGXFab3fF7AW0mexqU1eaF2BNnWM

