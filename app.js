const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3000;
const IP_ADDRESS = '192.168.56.1';


app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

const db = new sqlite3.Database('./courses.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the database.');
});


//db creation
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS lecturers (
            id INTEGER PRIMARY KEY,
            name TEXT
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS courses (
            id INTEGER PRIMARY KEY,
            course_image BLOB, 
            title TEXT,
            description TEXT,
            course_material TEXT,
            lecturer_id INTEGER,
            FOREIGN KEY (lecturer_id) REFERENCES lecturers(id) ON DELETE CASCADE
        )
    `);
});

//main page
app.get('/', (req, res) => {
    db.all(`SELECT * FROM courses`, [], (err, courses) => {
        if (err) {
            console.error(err.message);
            return;
        }

        db.all(`SELECT * FROM lecturers`, [], (err, lecturers) => {
            if (err) {
                console.error(err.message);
                return;
            }

            res.render('index', { courses, lecturers });
        });
    });
});
//-------------------------------------------------------------------------------------------------------------------------------------------

// Directs you to add course page
app.get('/add_course', (req, res) => {
    db.all(`SELECT * FROM courses`, [], (err, courses) => {
        if (err) {
            console.error(err.message);
            return;
        }

        db.all(`SELECT * FROM lecturers`, [], (err, lecturers) => {
            if (err) {
                console.error(err.message);
                return;
            }

            res.render('addcourse', { courses, lecturers });
        });
    });
});
//----------------------------------------------------------------------------------------------------------------------------------------------------


//view all the courses
app.get('/view_courses', (req, res) => {
    db.all(`SELECT * FROM courses`, [], (err, courses) => {
        if (err) {
            console.error(err.message);
            return;
        }

        db.all(`SELECT * FROM lecturers`, [], (err, lecturers) => {
            if (err) {
                console.error(err.message);
                return;
            }

            res.render('view_course', { courses, lecturers });
        });
    });
});

//-----------------------------------------------------------------------------------------------------------------------------------------------------

//get all courses endpoint
app.get('/courses', (req, res) => {
    db.all(`SELECT * FROM courses`, [], (err, courses) => {
        if (err) {
            console.error(err.message);
            res.status(500).json({ error: 'Failed to fetch courses' });
        } else {
            res.status(200).json(courses);
        }
    });
});

//-------------------------------------------------------------------------------------------------------------------------------------------------------


//Adding courses form the course button
app.post('/courses/create', (req, res) => {
    const { course_image, title, description, course_material, lecturer_id } = req.body;

    db.run(`INSERT INTO courses (course_image, title, description, course_material, lecturer_id) VALUES (?, ?, ?, ?, ?)`, [course_image, title, description, course_material, lecturer_id], (err) => {
        if (err) {
            console.error(err.message);
        }
        res.redirect('/view_courses');
    });
});

//------------------------------------------------------------------------------------------------------------------------------------------------------
// Update a course form
app.get('/editCourse/:id', (req, res) => {
    const courseId = req.params.id;

    // Fetch the course details and lecturer list from the database
    db.serialize(() => {
        db.get(`SELECT * FROM courses WHERE id = ?`, [courseId], (err, course) => {
            if (err) {
                console.error('Error fetching course:', err.message);
                return res.status(500).send('Error fetching course');
            }
            db.all(`SELECT * FROM lecturers`, (err, lecturers) => {
                if (err) {
                    console.error('Error fetching lecturers:', err.message);
                    return res.status(500).send('Error fetching lecturers');
                }
                res.render('EditCourse', { course, lecturers });
            });
        });
    });
});

//update course button
app.post('/editCourse/:id', (req, res) => {
    const courseId = req.params.id;
    const { course_image, title, description, course_material, lecturer_id } = req.body;

    db.run(
        `UPDATE courses SET course_image = ?, title = ?, description = ?, course_material = ?, lecturer_id = ? WHERE id = ?`,
        [course_image, title, description, course_material, lecturer_id, courseId],
        (err) => {
            if (err) {
                console.error('Error updating course:', err.message);
                return res.status(500).send('Error updating course');
            }
            res.redirect(303, '/view_courses');
        }
    );
});

//-----------------------------------------------------------------------------------------------------------------------------------------------
app.post('/deleteCourse/:id', (req, res) => {
    const courseId = req.params.id;

    const sql = `DELETE FROM courses WHERE id = ?`;

    db.run(sql, [courseId], (err) => {
        if (err) {
            console.error('Error deleting course:', err.message);
            return res.status(500).send('Error deleting course');
        }
        res.redirect('/view_courses');
    });
});


//-----------------------------------------------------------------------------------------------------------------------------------------------
// Add Lecture page
app.get('/add_lecturer', (req, res) => {
    res.render('add_lectures')
});

// Get All lecturers
app.get('/all_lectures', (req, res) => {
    db.all(`SELECT * FROM lecturers`, [], (err, lecturers) => {
        if (err) {
            console.error(err.message);
            res.status(500).json({ error: 'Failed to fetch lecturers' });
        } else {
            res.status(200).json(lecturers);
        }
    });
});
//--------------------------------------------------------------------------------------------------------------------------------------------------------
//view_one course
app.get('/viewCourse/:id', (req, res) => {
    const courseId = req.params.id;
    const { course_image, title, description, course_material, lecturer_id } = req.body;
    // Fetch the course details from the database using courseId
    // You would typically fetch the course details using your database logic
    const course = {
      id: courseId,
      title: title,
      description: description,
      course_image: course_image,
      course_material_vid : course_material,
      lect : lecturer_id
    };
    res.render('viewCourse', { course }); // Render the viewCourse.ejs template with course details
  });

//-----------------------------------------------------------------------------------------------------------------------------------------------------
  
//Create A proffessor
app.post('/lecturers/create', (req, res) => {
    const { name } = req.body;

    db.run(`INSERT INTO lecturers (name) VALUES (?)`, [name], (err) => {
        if (err) {
            console.error(err.message);
        }
        res.redirect('/add_course');
    });
});


//port
app.listen(port, IP_ADDRESS, () => {
    console.log(`Server is running at http://${IP_ADDRESS}:${port}`);
});