-- Create personal_info table
CREATE TABLE personal_info (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  designation VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  experience_years INTEGER,
  email VARCHAR(255),
  github VARCHAR(500),
  linkedin VARCHAR(500),
  bio TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create skills table
CREATE TABLE skills (
  id SERIAL PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  skill VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create blogs table
CREATE TABLE blogs (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  published_date DATE,
  category VARCHAR(100),
  read_time INTEGER,
  views INTEGER DEFAULT 0,
  url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'Draft',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create experience table
CREATE TABLE experience (
  id SERIAL PRIMARY KEY,
  company VARCHAR(255) NOT NULL,
  position VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert data
INSERT INTO personal_info (name, designation, location, experience_years, email, github, linkedin, bio) VALUES
('Kruthik B S', 'Software Engineer', 'Bengaluru, India', 5, 'kruthik22bs@gmail.com', 'https://github.com/kruthik-b-s', 'https://www.linkedin.com/in/kruthikbs/', 'Passionate full-stack developer with expertise in building scalable backend systems and modern web applications.');

INSERT INTO skills (category, skill) VALUES
('Backend', 'Node.js (ExpressJS, NestJS)'),
('Backend', 'Java (Spring, Spring Boot)'),
('Database', 'PostgreSQL'),
('Database', 'MongoDB'),
('Database', 'MySQL'),
('Database', 'Redis'),
('Cloud', 'AWS'),
('Cloud', 'Azure'),
('DevOps', 'Docker'),
('DevOps', 'Kubernetes'),
('Frontend', 'React.js'),
('Frontend', 'Next.js'),
('Miscellaneous', 'SigNoz'),
('Miscellaneous', 'Datadog'),
('Miscellaneous', 'kafka');

-- INSERT INTO blogs (title, published_date, category, read_time, views, url, status) VALUES
-- ('Building Scalable APIs with Node.js and PostgreSQL', '2024-01-15', 'Backend', 8, 1250, 'https://blog.example.com/scalable-apis-nodejs-postgresql', 'Published'),
-- ('Database Indexing Strategies for High Performance', '2024-01-02', 'Database', 12, 890, 'https://blog.example.com/database-indexing-strategies', 'Published'),
-- ('React Server Components: A Deep Dive', '2023-12-20', 'Frontend', 10, 2100, 'https://blog.example.com/react-server-components', 'Published'),
-- ('Microservices Architecture Patterns', '2023-12-05', 'Architecture', 15, 1680, 'https://blog.example.com/microservices-patterns', 'Published'),
-- ('Advanced SQL Techniques for Developers', '2023-11-18', 'Database', 14, 1420, 'https://blog.example.com/advanced-sql-techniques', 'Published'),
-- ('Docker Best Practices for Production', '2023-11-01', 'DevOps', 9, 980, 'https://blog.example.com/docker-best-practices', 'Published'),
-- ('GraphQL vs REST: When to Use What', '2023-10-15', 'API', 11, 1850, 'https://blog.example.com/graphql-vs-rest', 'Published'),
-- ('Building Real-time Applications with WebSockets', '2023-10-01', 'Backend', 13, 1320, 'https://blog.example.com/realtime-websockets', 'Draft');

INSERT INTO experience (company, position, start_date, end_date, description) VALUES
('Codecraft Technologies Pvt Ltd', 'Software Engineer', '2023-08-01', NULL, 'Built high-performance, scalable microservices and RESTful APIs using Spring Boot, NestJS, and ExpressJS, with enhanced observability and secure multi-tenant authentication—resulting in 50% better maintainability, 25% faster response times, and 75% preemptive issue resolution.'),
('Codecraft Technologies Pvt Ltd', 'Intern', '2023-02-21', '2023-07-31', 'Developed responsive web applications using Node.js and React.js while actively contributing across the development lifecycle, showcasing strong problem-solving skills and ensuring code quality through effective version control with GitHub and GitLab.');
