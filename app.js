const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3000;
const IP_ADDRESS = '192.168.1.79';


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
//start page
app.get('/home', (req, res) => {
    res.render('index')
});

//add coursepage
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

//view all courses
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


//get all courses
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


//get only one course
app.get('/courses/:id', (req, res) => {
    const courseId = req.params.id;

    db.get(`SELECT * FROM courses WHERE id = ?`, [courseId], (err, course) => {
        if (err) {
            console.error(err.message);
            res.status(500).json({ error: 'Failed to fetch course' });
        } else {
            if (course) {
                res.status(200).json(course);
            } else {
                res.status(404).json({ error: 'Course not found' });
            }
        }
    });
});




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

// ...
//Adding courses
app.post('/courses/create', (req, res) => {
    const { course_image, title, description, course_material, lecturer_id } = req.body;

    db.run(`INSERT INTO courses (course_image, title, description, course_material, lecturer_id) VALUES (?, ?, ?, ?, ?)`, [course_image, title, description, course_material, lecturer_id], (err) => {
        if (err) {
            console.error(err.message);
        }
        res.redirect('/');
    });
});

// Update a course

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


app.post('/deleteCourse/:id', (req, res) => {
    const courseId = req.params.id;

    const sql = `DELETE FROM courses WHERE id = ?`;

    db.run(sql, [courseId], (err) => {
        if (err) {
            console.error('Error deleting course:', err.message);
            return res.status(500).send('Error deleting course');
        }
        res.redirect('/');
    });
});
// Delete a course
app.delete('/courses/:id', (req, res) => {
    const courseId = req.params.id;

    db.run(`DELETE FROM courses WHERE id = ?`, [courseId], (err) => {
        if (err) {
            console.error(err.message);
        }
        res.redirect('view_course');
    });
});



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