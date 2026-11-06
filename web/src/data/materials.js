// Study materials sourced from saiphy.com (Sai Sir's handcrafted notes).
// Format: [standard, subject, chapter, title, type, path]
// type: notes | pyq | formula | workbook | answer-key | revision | solutions
const U = 'https://saiphy.com/wp-content/uploads/'

const raw = [
  // ---------- 9th Standard ----------
  ['9th', 'Science', 'Ch.1 Laws of Motion', 'Laws of Motion', 'notes', '2025/06/Ch.1-Laws-of-Motion.pdf'],
  ['9th', 'Science', 'Ch.2 Work and Energy', 'Work and Energy', 'notes', '2025/06/Ch.2-Work-and-Energy.pdf'],
  ['9th', 'Science', 'Ch.6 Classification of Plants', 'Classification of Plants', 'notes', '2025/06/Ch.6-Classification-of-Plants.pdf'],
  ['9th', 'Science', 'Ch.11 Reflection of Light', 'Reflection of Light — Complete Chapter', 'notes', '2021/11/Reflection%20of%20light.pdf'],

  // ---------- 10th Standard: Science 1 ----------
  ['10th', 'Science 1', 'All Chapters', '10th Science 1 — Very Important 5 Mark Questions', 'workbook', '2026/10/10th-Science-1-Very-Important-5-Mark-Questions-By-Sai-Sir.pdf'],
  ['10th', 'Science 1', 'Chapterwise', 'Science 1 Chapterwise PYQ', 'pyq', '2026/10/Science-1-Chapterwise-PYQ-By-Sai-Sir-1.pdf'],
  ['10th', 'Science 1', 'All Chapters', 'Science 1 Complete Chapterwise Notes', 'notes', '2021/10/Science-1-By-Sai-Sir.pdf'],
  ['10th', 'Science 1', 'All Chapters', 'MCQ — Science 1', 'workbook', '2024/07/MCQ-By-Sai-Sir-Science-1.pdf'],
  ['10th', 'Science 1', 'Ch.1 Gravitation', 'Gravitation — Chapter Notes', 'notes', '2022/07/Gravitation.pdf'],
  ['10th', 'Science 1', 'Ch.1 Gravitation', 'Gravitation — Additional Problems', 'workbook', '2024/07/Gravitational-Additional-Problems.pdf'],
  ['10th', 'Science 1', 'Ch.2 Periodic Classification', 'Periodic Classification of Elements', 'notes', '2022/05/2.Periodic-Classification-of-Elements.pdf'],
  ['10th', 'Science 1', 'Ch.2 Periodic Classification', 'Periodic Elements — S & P Block Mnemonics', 'revision', '2022/04/Periodic-Elements-S-and-P-blocks.pdf'],
  ['10th', 'Science 1', 'Ch.2 Periodic Classification', 'Element Studies', 'notes', '2022/04/Element-Studies-By-Sai-Sir.pdf'],
  ['10th', 'Science 1', 'Ch.3 Chemical Reactions', 'Chemical Reactions and Equations', 'notes', '2022/05/Chemical-Reactions-and-Equations.pdf'],
  ['10th', 'Science 1', 'Ch.6 Refraction of Light', 'Refraction of Light', 'notes', '2022/09/Refraction-of-light.pdf'],
  ['10th', 'Science 1', 'Ch.9 Carbon Compounds', 'Carbon Compounds — Q&A', 'notes', '2025/12/10th-Ch.9-Carbon-Compounds-QA-By-Sai-Sir.pdf'],
  ['10th', 'Science 1', 'Ch.9 Carbon Compounds', 'Carbon Compounds — IUPAC Names', 'revision', '2025/12/Ch.9-Carbon-Compounds-IUPAC-Names-By-Sai-Sir.pdf'],
  ['10th', 'Science 1', 'All Chapters', 'Print Kar & Study Kar — Science 1 PYQ', 'pyq', '2026/10/Print-kar-and-Study-Kar-10th-Science-1-PYQ-By-Sai-Sir.pdf'],

  // ---------- 10th Standard: Science 2 ----------
  ['10th', 'Science 2', 'All Chapters', '10th Science 2 — Very Important 5 Mark Questions', 'workbook', '2026/10/10th-Science-2-Very-Important-5-Mark-Questions-By-Sai-Sir.pdf'],
  ['10th', 'Science 2', 'Chapterwise', 'Science 2 Chapterwise PYQ', 'pyq', '2026/10/Science-2-Chapterwise-PYQ-By-Sai-Sir.pdf'],
  ['10th', 'Science 2', 'All Chapters', 'Science 2 Complete Chapterwise Notes', 'notes', '2021/11/Science-2-By-Sai-Sir.pdf'],
  ['10th', 'Science 2', 'All Chapters', 'MCQ — Science 2', 'workbook', '2024/07/MCQ-By-Sai-Sir-Science-2.pdf'],
  ['10th', 'Science 2', 'Ch.5 Towards Green Energy', 'Towards Green Energy', 'notes', '2022/05/Towards-Green-Energy.pdf'],
  ['10th', 'Science 2', 'All Chapters', 'Print Kar & Study Kar — Science 2 PYQ', 'pyq', '2026/10/Print-kar-and-Study-Kar-10th-Science-2-PYQ-By-Sai-Sir.pdf'],

  // ---------- 10th Standard: Maths 1 ----------
  ['10th', 'Maths 1', 'Ch.1 Linear Equations', 'Linear Equations in Two Variables', 'notes', '2026/08/Ch.1-Linear-Equations-in-Two-Variable.pdf'],
  ['10th', 'Maths 1', 'Ch.2 Quadratic Equations', 'Quadratic Equations', 'notes', '2026/08/Ch.2-Quadratic-Equations.pdf'],
  ['10th', 'Maths 1', 'Ch.3 Arithmetic Progression', 'Arithmetic Progression', 'notes', '2026/08/Ch.3-Arthimetic-Progression.pdf'],
  ['10th', 'Maths 1', 'Ch.4 Financial Planning', 'Financial Planning', 'notes', '2026/08/Ch.4-Financial-Planning.pdf'],
  ['10th', 'Maths 1', 'Ch.5 Probability', 'Probability', 'notes', '2026/08/Ch.5-Probability.pdf'],
  ['10th', 'Maths 1', 'Ch.6 Statistics', 'Statistics', 'notes', '2026/08/Ch.6-Statistics.pdf'],
  ['10th', 'Maths 1', 'All Chapters', 'Challenging Questions — Maths 1', 'workbook', '2026/08/Challenging-Questions-Maths-1.pdf'],
  ['10th', 'Maths 1', 'Chapterwise', 'Maths 1 Chapterwise PYQs', 'pyq', '2025/12/10th-Maths-1-Chapterwise-PYQs-By-Sai-Sir.pdf'],
  ['10th', 'Maths 1', 'All Chapters', 'Maths 1 & 2 — IMP Questions Workbook', 'workbook', '2025/10/10th-Maths-1-and-2-IMP-Questions-Workbook.pdf'],
  ['10th', 'Maths 1', 'All Chapters', 'Print Kar & Study Kar — Maths 1 PYQ', 'pyq', '2026/10/Print-kar-and-Study-Kar-10th-Maths-1-PYQ-By-Sai-Sir.pdf'],

  // ---------- 10th Standard: Maths 2 ----------
  ['10th', 'Maths 2', 'Ch.1 Similarity', 'Similarity', 'notes', '2026/08/Ch.1-Similarity.pdf'],
  ['10th', 'Maths 2', 'Ch.2 Pythagoras Theorem', 'Pythagoras Theorem', 'notes', '2026/08/Ch.2-Pythagoars.pdf'],
  ['10th', 'Maths 2', 'Ch.3 Circle', 'Circle', 'notes', '2026/08/Ch.3-Circle.pdf'],
  ['10th', 'Maths 2', 'Ch.4 Geometric Constructions', 'Geometric Constructions', 'notes', '2026/08/Ch.4-Geometric-Constructions.pdf'],
  ['10th', 'Maths 2', 'Ch.5 Coordinate Geometry', 'Coordinate Geometry', 'notes', '2026/08/Ch.5-Coordinate-geomerty.pdf'],
  ['10th', 'Maths 2', 'Ch.6 Trigonometry', 'Trigonometry', 'notes', '2026/08/Ch.6-Trignometry.pdf'],
  ['10th', 'Maths 2', 'Ch.7 Mensuration', 'Mensuration', 'notes', '2026/08/Ch.7-Mensuration.pdf'],
  ['10th', 'Maths 2', 'All Chapters', 'Challenging Questions — Maths 2', 'workbook', '2026/08/Challenging-Questions-Maths-2.pdf'],

  // ---------- 10th Standard: Social Science & Languages ----------
  ['10th', 'History & Pol. Science', 'Chapterwise', 'History Chapterwise PYQs', 'pyq', '2025/12/10th-History-Chapterwise-PYQs-by-Sai-Sir.pdf'],
  ['10th', 'History & Pol. Science', 'All Chapters', 'History IMP Questions Workbook', 'workbook', '2025/10/10th-History-IMP-Questions-Workbook.pdf'],
  ['10th', 'Geography', 'Chapterwise', 'Geography Chapterwise PYQs', 'pyq', '2025/12/10th-Geography-Chapterwise-PYQs-by-Sai-Sir.pdf'],
  ['10th', 'Geography', 'All Chapters', 'Geography IMP Questions Workbook', 'workbook', '2025/10/10th-Geography-IMP-Questions-Workbook.pdf'],
  ['10th', 'Geography', 'Maps', 'Geography Map Markings', 'revision', '2025/11/10th-Geography-Map-Markings-By-Sai-Sir.pdf'],
  ['10th', 'Geography', 'Maps', 'Geography Maps — India & Brazil', 'revision', '2022/04/10th-Geography-Maps-By-Sai-Sir.pdf'],
  ['10th', 'English', 'All Chapters', 'English Last Minute Revision (English Medium)', 'revision', '2025/12/10th-English-Last-Minute-RevisionEnglish-Medium.pdf'],
  ['10th', 'Marathi', 'All Chapters', 'Marathi Aksharbharati IMP Questions Workbook', 'workbook', '2025/10/10th-Marathi-Asharbharti-IMP-Questions-Workbook.pdf'],
  ['10th', 'Marathi', 'Writing', 'Marathi Quotations', 'revision', '2026/02/10th-Marathi-Quotation.pdf'],
  ['10th', 'Marathi', 'Writing', 'Marathi Essay — Start & End', 'revision', '2026/02/10th-Marathi-EssayStart-End.pdf'],
  ['10th', 'Marathi', 'Activity', 'Marathi Activity — Print Kar & Study Kar', 'workbook', '2026/02/10th-Marathi-Activity-Print-Kar-and-Study-Kar.pdf'],
  ['10th', 'Marathi', 'Grammar', 'वाक्प्रचार (Marathi Idioms)', 'revision', '2026/02/10th-%E0%A4%B5%E0%A4%BE%E0%A4%95%E0%A5%8D%E0%A4%AA%E0%A5%8D%E0%A4%B0%E0%A4%9A%E0%A4%BE%E0%A4%B0.pdf'],
  ['10th', 'Hindi', 'Grammar', 'Hindi Vyakran (by Hemant Sir)', 'notes', '2026/01/10th-Hindi-Vyakran-By-Hemant-Sir.pdf'],

  // ---------- 10th Board PYQ papers ----------
  ['10th', 'Board Papers', 'March 2026', 'SSC Board Papers — March 2026', 'pyq', '2026/10/10th-Standard-Board-Papers-March-2026.pdf'],
  ['10th', 'Board Papers', 'July 2025', 'SSC Board Papers — July 2025', 'pyq', '2026/10/10th-Standard-Board-Papers-July-2025.pdf'],
  ['10th', 'Board Papers', 'March 2025', 'SSC Board Papers — March 2025', 'pyq', '2025/10/10th-Standard-Board-Papers-March-2025.pdf'],
  ['10th', 'Board Papers', 'March 2024', 'SSC Board Papers — March 2024', 'pyq', '2024/12/10th-Standard-Board-Papers-March-2024.pdf'],
  ['10th', 'Board Papers', 'July 2023', 'SSC Board Papers — July 2023', 'pyq', '2024/12/10th-Standard-Board-Papers-July-2023.pdf'],
  ['10th', 'Board Papers', 'March 2023', 'SSC Board Papers — March 2023', 'pyq', '2024/12/10th-Standard-Board-Papers-March-2023.pdf'],
  ['10th', 'Board Papers', 'July 2022', 'SSC Board Papers — July 2022', 'pyq', '2024/12/10th-Standard-Board-Papers-July-2022.pdf'],
  ['10th', 'Board Papers', 'March 2022', 'SSC Board Papers — March 2022', 'pyq', '2024/12/10th-Standard-Board-Papers-March-2022.pdf'],
  ['10th', 'Board Papers', 'Dec 2020', 'SSC Board Papers — December 2020', 'pyq', '2024/12/10th-Standard-Board-Papers-Dec-2020.pdf'],
  ['10th', 'Board Papers', 'March 2020', 'SSC Board Papers — March 2020', 'pyq', '2024/12/10th-Standard-Board-Papers-March-2020.pdf'],
  ['10th', 'Board Papers', 'July 2019', 'SSC Board Papers — July 2019', 'pyq', '2024/12/10th-Standard-Board-Papers-July-2019.pdf'],
  ['10th', 'Board Papers', 'March 2019', 'SSC Board Papers — March 2019', 'pyq', '2024/12/10th-Standard-Board-Papers-March-2019.pdf'],
  ['10th', 'Sarav Pariksha', 'Level 1', 'English EM Level 1 — Answer Key (01.11.2026)', 'answer-key', '2026/11/English-EM-Level-1-Answer-Key-01.11.2026.pdf'],

  // ---------- 11th Science ----------
  ['11th Science', 'Physics', 'Ch.1 Units and Dimensions', 'Units and Dimensions', 'notes', '2022/07/Units-Dimensions-By-Sai-Sir.pdf'],

  // ---------- 12th Science (PCMB) ----------
  ['12th Science', 'Physics', 'All Chapters', 'Physics Question-wise PYQ 2026 (Print Kar & Study Kar)', 'pyq', '2026/01/Print-kar-and-Study-Kar-12th-Physics-PYQ-By-Sai-Sir.pdf'],
  ['12th Science', 'Physics', 'All Chapters', 'Physics Handwritten Notes', 'notes', '2024/12/12th-Physics-Handwritten.pdf'],
  ['12th Science', 'Physics', 'All Chapters', 'HSC Physics Full Question Bank Solutions', 'solutions', '2023/02/Hsc-Physics-Full-Question-Bank-Solutions-By-SAI-SIR-with-saiphy-with-water-mark.pdf'],
  ['12th Science', 'Physics', 'Ch.8 Electrostatics', 'Electrostatics (Physics 2)', 'notes', '2021/11/Electrostatics.pdf'],
  ['12th Science', 'Physics', 'Formulas', 'Physics — All Chapterwise Formulas', 'formula', '2023/02/12th-Physics-All-Chapterwise-Formulae-2023.pdf'],
  ['12th Science', 'Chemistry', 'Formulas', 'Chemistry — All Chapterwise Formulas', 'formula', '2023/02/12th-Chemistry-All-Chapterwise-Formulae-2023.pdf'],
  ['12th Science', 'Mathematics', 'Formulas', 'Mathematics — All Chapterwise Formulas', 'formula', '2023/02/12th-Mathematics-All-Chapterwise-Formulae-2023.pdf'],
  ['12th Science', 'Board Papers', 'July 2024', 'HSC PCMB Board Papers — July 2024', 'pyq', '2024/12/1.PCMBEHM-July-2024.pdf'],
  ['12th Science', 'Board Papers', 'July 2023', 'HSC PCMB Board Papers — July 2023', 'pyq', '2024/12/2.PCMBEM-July-2023.pdf'],
  ['12th Science', 'Board Papers', 'July 2022', 'HSC PCMB Board Papers — July 2022', 'pyq', '2024/12/4.PCMB-July-2022.pdf'],
  ['12th Science', 'Board Papers', 'Feb 2022', 'HSC PCMB Board Papers — Feb 2022', 'pyq', '2024/12/5.PCMB-Feb-2022.pdf'],
  ['12th Science', 'Board Papers', 'March 2020', 'HSC PCMB Board Papers — March 2020', 'pyq', '2024/12/6.PCMB-March-2020.pdf'],
  ['12th Science', 'Board Papers', 'July 2019', 'HSC PCMB Board Papers — July 2019', 'pyq', '2024/12/7.PCMB-July-2019.pdf'],
  ['12th Science', 'Board Papers', 'March 2019', 'HSC PCMB Board Papers — March 2019', 'pyq', '2024/12/8.PCMB-March-2019.pdf'],

  // ---------- JEE / NEET / MHT-CET ----------
  ['JEE / NEET / CET', 'Physics', 'Revision', 'Physics Fast Revision Notes for MHT-CET', 'revision', '2023/01/PHYSICS-Fast-Revision-Notes-By-SAIPHY-For-MHT-CET.pdf'],
  ['JEE / NEET / CET', 'Physics', 'Revision', 'Physics Flash Cards (JEE Main | NEET-UG | MHT-CET)', 'revision', '2022/03/PHYSICS-FLASHCARD-By-Sai-Sir.pdf'],
  ['JEE / NEET / CET', 'Physics', 'Formulas', 'Physics — All Chapterwise Formulas', 'formula', '2023/02/12th-Physics-All-Chapterwise-Formulae-2023.pdf'],
  ['JEE / NEET / CET', 'Chemistry', 'Formulas', 'Chemistry — All Chapterwise Formulas', 'formula', '2023/02/12th-Chemistry-All-Chapterwise-Formulae-2023.pdf'],
  ['JEE / NEET / CET', 'Mathematics', 'Formulas', 'Mathematics — All Chapterwise Formulas', 'formula', '2023/02/12th-Mathematics-All-Chapterwise-Formulae-2023.pdf'],

  // ---------- 12th Commerce ----------
  ['12th Commerce', 'MAH-CET (BBA/BCA/BMS/BMM)', 'PYQ', 'MAH-CET PYQ — BCA, BMS, BBA, BMM', 'pyq', '2025/04/MAHACET-PYQ-By-www.saiphy.com_.pdf'],
  ['12th Commerce', 'MAH-CET (BBA/BCA/BMS/BMM)', 'Computer Basics', 'MAH-CET Computer Basics — BCA, BMS, BBA, BMM', 'notes', '2025/04/Computer-basics-CET-1-www.saiphy.com_.pdf'],
  ['12th Commerce', 'Mathematics & Statistics', 'Part 1', 'Mathematics & Statistics — Part 1', 'notes', '2024/08/Mathematics_and_Statistics_Part_1_12_th_Commerce.pdf'],
  ['12th Commerce', 'Mathematics & Statistics', 'Part 2', 'Mathematics & Statistics — Part 2', 'notes', '2024/08/Mathematics_and_Statistics_Part_2_12_th_Commerce.pdf'],
  ['12th Commerce', 'Book Keeping & Accountancy', 'All Chapters', 'Book Keeping & Accountancy — Memory Map', 'revision', '2024/10/BK-MEMORY-MAP.pdf'],
  ['12th Commerce', 'Book Keeping & Accountancy', 'All Chapters', 'Book Keeping — Answer in One Sentence', 'workbook', '2024/10/12th-Book-Keeping-Answer-in-One-Sentence.pdf'],
  ['12th Commerce', 'Economics', 'All Chapters', 'Economics — Memory Map', 'revision', '2024/10/Economics-memory-map.pdf'],
  ['12th Commerce', 'Economics', 'All Chapters', 'Economics — Identify & Explain the Concept', 'workbook', '2024/10/Identify-and-Explain-the-Concept-Economics.pdf'],
  ['12th Commerce', 'Secretarial Practice', 'All Chapters', 'Secretarial Practice — Memory Map', 'revision', '2024/10/Sp-memory-map.pdf'],

  // ---------- 11th IT (FYJC) ----------
  ['11th IT', 'Information Technology', 'Ch.1', 'Basics of Information Technology', 'notes', '2021/11/1.-Basics-of-Information-Technology.pdf'],
  ['11th IT', 'Information Technology', 'Ch.2', 'Introduction to DBMS', 'notes', '2022/01/Ch.2-Introduction-to-DBMS.pdf'],
  ['11th IT', 'Information Technology', 'Ch.3', 'Impressive Web Designing', 'notes', '2022/03/Impressive-Web-Design-Copy.pdf'],
  ['11th IT', 'Information Technology', 'Ch.4', 'Cyber Law', 'notes', '2022/03/4.Cyber-Law.pdf'],

  // ---------- 12th IT (SYJC) ----------
  ['12th IT', 'Information Technology', 'All Chapters', 'SYJC IT (Commerce) Textbook Exercise Solutions', 'solutions', '2024/11/SYJC-IT-Textbook-Solutions-By-Sai-Sir.pdf'],
  ['12th IT', 'Information Technology', 'Ch.1', 'Advanced Web Designing', 'notes', '2024/11/Ch.1-Advanced-Web-Designing.pdf'],
  ['12th IT', 'Information Technology', 'Ch.2', 'Digital Marketing', 'notes', '2024/11/Ch.2-Digital-Marketing.pdf'],
  ['12th IT', 'Information Technology', 'Ch.3', 'Computerised Accounting with GST', 'notes', '2024/11/Ch.3-Computerised-Accounting-with-GST.pdf'],
  ['12th IT', 'Information Technology', 'Ch.4', 'E-Commerce and E-Governance', 'notes', '2024/11/Ch.4-E-Commerce-and-E-Governance.pdf'],
  ['12th IT', 'Information Technology', 'Ch.5', 'Database Concepts using LibreOffice Base', 'notes', '2024/11/Ch.5-Database-concepts-usig-LibreOffice-Base.pdf'],
  ['12th IT', 'Information Technology', 'Ch.6', 'Enterprise Resource Planning (ERP)', 'notes', '2024/11/Ch.6-Enterprise-Resource-PlanningERP.pdf'],
  ['12th IT', 'Information Technology', 'Practicals', 'SOP — Advanced Web Designing Practicals', 'notes', '2023/08/SOP-Advanced-Web-Designing-Practicals-by-Sai-Sir.jpg'],
  ['12th IT', 'Information Technology', 'Revision', '12th Commerce IT — Tips', 'revision', '2024/09/12th-Commerce-IT-Tps-By-Sai-Sir.pdf'],
  ['12th IT', 'Information Technology', 'Sample Paper', 'HSC Information Technology Sample Paper', 'pyq', '2022/03/SAMPLE-PAPER-2022-By-Sai-Sir.pdf'],
  ['12th IT', 'Information Technology', 'Revision', '12th Science IT — Tips', 'revision', '2024/10/SCIENCE-HSC-IT-TPS-1.pdf'],
  ['12th IT', 'Information Technology', 'All Chapters', 'HSC IT (Science) Complete Notes', 'notes', '2025/01/12th-Hsc-Information-Technology-IT-Complete-Notes-By-Sai-Sir.pdf'],

  // ---------- 12th Computer Science ----------
  ['12th Computer Science', 'Computer Science', 'Part 1 & 2', 'Computer Science 1 & 2 — Cheat Sheet', 'revision', '2025/10/Computer-Science-1-and-2-Cheat-Sheet.pdf'],
  ['12th Computer Science', 'Computer Science', 'Part 1', 'Computer Science 1 — Most Likely Questions', 'workbook', '2023/02/wp-1675514032011.pdf'],
  ['12th Computer Science', 'Computer Science', 'Part 2', 'Computer Science 2 — Most Likely Questions', 'workbook', '2023/02/wp-1675514032631.pdf'],

  // ---------- 12th Electronics ----------
  ['12th Electronics', 'Electronics', 'All Chapters', 'HSC Electronics — Most Likely Questions', 'workbook', '2025/01/12th-Hsc-Electronics-Most-Likely-Questions-By-Sai-Sir.pdf'],
  ['12th Electronics', 'Electronics', 'Part 1', 'Electronics Notes — Part 1', 'notes', '2025/10/Electronics-Notes-Part-1-By-Sai-Sir.pdf'],
  ['12th Electronics', 'Electronics', 'Part 2', 'Electronics Notes — Part 2', 'notes', '2025/10/Electronics-Notes-Part-2-By-Sai-Sir.pdf'],
  ['12th Electronics', 'Electronics', 'Guess Papers', 'Guessing Papers 1–2 (Sub Code C2)', 'pyq', '2025/01/Guessing-Papers-1-2-12th-Electronics-Sub-Code-C2-.pdf'],

  // ---------- Programming ----------
  ['Programming', 'HTML', 'Complete Course', 'Learn HTML: From Basics to Advanced', 'notes', '2021/11/html_tutorial_by-Sai-sir.pdf'],
]

export const SEED_MATERIALS = raw.map(([standard, subject, chapter, title, type, path], i) => ({
  id: 'm' + (i + 1),
  standard, subject, chapter, title, type,
  url: U + path,
  visibility: 'public',
  batchIds: [],
  source: 'saiphy.com',
  uploadedBy: 'Sai Sir',
  createdAt: new Date(2026, 0, 1 + (i % 28)).toISOString(),
}))

export const STANDARDS = ['9th', '10th', '11th Science', '12th Science', '11th IT', '12th IT', '12th Commerce', '12th Computer Science', '12th Electronics', 'JEE / NEET / CET', 'Programming']
export const MATERIAL_TYPES = {
  notes: 'Notes', pyq: 'Question Papers', formula: 'Formula Sheet', workbook: 'Workbook / IMP Qs',
  'answer-key': 'Answer Key', revision: 'Quick Revision', solutions: 'Solutions',
}
