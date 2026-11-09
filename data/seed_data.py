import json
from sqlalchemy.orm import Session
from backend.database.session import SessionLocal, engine, Base
from backend.database.models import (
    School, Department, Researcher, Publication, ResearchTheme,
    Laboratory, InstitutionalResource, CollaborationOpportunity, EvaluationBenchmark
)

def seed_database():
    """Populates the SQLite database with 32 realistic synthetic researchers and 64 publications."""
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    # Check if already seeded
    if db.query(School).count() > 0:
        print("Database already contains data. Skipping initial seeding.")
        db.close()
        return

    print("Seeding synthetic institutional research data...")

    # 1. Schools
    schools_data = [
        {"name": "School of Computer Science & Engineering", "code": "SCSE", "dean_name": "Dr. Rajesh Sharma", "building": "Block 34, Academic Complex"},
        {"name": "School of Bioengineering & Biosciences", "code": "SBBS", "dean_name": "Dr. Sunita Deshmukh", "building": "Block 28, Life Sciences Wing"},
        {"name": "School of Pharmaceutical Sciences", "code": "SPS", "dean_name": "Dr. Arun K. Verma", "building": "Block 15, Health Sciences"},
        {"name": "School of Agriculture", "code": "SAGR", "dean_name": "Dr. Gurpreet Singh", "building": "Block 42, Agricultural Research Hub"},
        {"name": "School of Electronics & Electrical Engineering", "code": "SEEE", "dean_name": "Dr. Priya Nair", "building": "Block 31, Technology Tower"},
        {"name": "School of Mechanical Engineering", "code": "SME", "dean_name": "Dr. Vikram Sethi", "building": "Block 38, Engineering Pavilion"},
    ]
    school_objs = {}
    for s in schools_data:
        obj = School(**s)
        db.add(obj)
        db.flush()
        school_objs[s["code"]] = obj

    # 2. Departments
    departments_data = [
        {"name": "Department of Artificial Intelligence & Machine Learning", "code": "AIML", "school_code": "SCSE"},
        {"name": "Department of Computer Science & Data Science", "code": "CSDS", "school_code": "SCSE"},
        {"name": "Department of Biotechnology & Genetics", "code": "BIOT", "school_code": "SBBS"},
        {"name": "Department of Microbiology & Immunology", "code": "MCBI", "school_code": "SBBS"},
        {"name": "Department of Pharmaceutics & Drug Delivery", "code": "PDEV", "school_code": "SPS"},
        {"name": "Department of Pharmacology & Toxicology", "code": "PTCL", "school_code": "SPS"},
        {"name": "Department of Agronomy & Soil Science", "code": "AGRO", "school_code": "SAGR"},
        {"name": "Department of Plant Pathology & Breeding", "code": "PLNT", "school_code": "SAGR"},
        {"name": "Department of IoT & Embedded Systems", "code": "IOTE", "school_code": "SEEE"},
        {"name": "Department of Signal Processing & Automation", "code": "SGPR", "school_code": "SEEE"},
        {"name": "Department of Robotics & Mechatronics", "code": "ROBO", "school_code": "SME"},
        {"name": "Department of Thermal & Renewable Energy", "code": "THER", "school_code": "SME"},
    ]
    dept_objs = {}
    for d in departments_data:
        school_id = school_objs[d["school_code"]].id
        obj = Department(name=d["name"], code=d["code"], school_id=school_id)
        db.add(obj)
        db.flush()
        dept_objs[d["code"]] = obj

    # 3. Research Themes
    themes_data = [
        {"name": "Artificial Intelligence", "category": "Computer Science", "description": "Foundational deep neural networks, generative modeling, and automated reasoning."},
        {"name": "Machine Learning", "category": "Data Science", "description": "Predictive modeling, reinforcement learning, and statistical pattern recognition."},
        {"name": "Computer Vision", "category": "Computer Science", "description": "Deep image segmentation, feature extraction, radiological scans, and real-time object tracking."},
        {"name": "Natural Language Processing", "category": "Computer Science", "description": "Transformer architectures, clinical text extraction, summarization, and semantic search."},
        {"name": "Healthcare Informatics", "category": "Medical & Health", "description": "Clinical decision support systems, wearable patient telemetry, and electronic health records."},
        {"name": "Bioinformatics & Genomics", "category": "Life Sciences", "description": "Computational gene sequencing, DNA microarray analysis, and structural biology."},
        {"name": "Targeted Drug Delivery", "category": "Pharmaceutical Sciences", "description": "Liposomal nano-carriers, biodegradable polymers, and controlled release pharmacokinetics."},
        {"name": "Nanomedicine", "category": "Pharmaceutical Sciences", "description": "Nanoparticle formulations for oncology therapeutics and intracellular molecular targeting."},
        {"name": "Precision Agriculture", "category": "Agricultural Sciences", "description": "Satellite vegetation index, automated drone surveillance, and sensor-based soil health."},
        {"name": "Crop Disease Diagnostics", "category": "Agricultural Sciences", "description": "Early fungal/bacterial lesion detection through multispectral and computer vision imagery."},
        {"name": "IoT & Smart Sensors", "category": "Electronics & Electrical", "description": "Low-power edge devices, wireless mesh telemetry networks, and real-time environmental sensors."},
        {"name": "Robotics & Autonomous Systems", "category": "Mechanical Engineering", "description": "Kinematics, automated mobile robots, surgical robotic manipulators, and agricultural rovers."},
        {"name": "Cybersecurity & Cryptography", "category": "Computer Science", "description": "Zero-trust architectures, secure multiparty computation, and privacy-preserving federated learning."},
        {"name": "Renewable Energy & Smart Grids", "category": "Energy & Sustainability", "description": "Photovoltaic optimization, microgrid load balancing, and battery degradation prediction."},
        {"name": "Biomaterials & Tissue Engineering", "category": "Life Sciences", "description": "Scaffold fabrication, cell biocompatibility, and regenerative musculoskeletal repair."},
    ]
    theme_objs = {}
    for t in themes_data:
        obj = ResearchTheme(name=t["name"], category=t["category"], description=t["description"])
        db.add(obj)
        db.flush()
        theme_objs[t["name"]] = obj

    # 4. Institutional Resources & Laboratories
    labs_data = [
        {"name": "Advanced Vision & Neural Computing Lab", "school_code": "SCSE", "room_no": "34-401", "focus": ["Deep Learning", "Medical Image Processing", "Edge AI"]},
        {"name": "High Performance Genomic Computing Center", "school_code": "SBBS", "room_no": "28-102", "focus": ["Next-Gen Sequencing", "Protein Folding", "Transcriptomics"]},
        {"name": "Nanotechnology & Controlled Drug Release Lab", "school_code": "SPS", "room_no": "15-204", "focus": ["Nano-emulsions", "Targeted Oncology", "Pharmacokinetics"]},
        {"name": "Precision Agrotechnology & Drone Hub", "school_code": "SAGR", "room_no": "42-005", "focus": ["Multispectral Crop Scouting", "Soil Sensors", "Smart Irrigation"]},
        {"name": "Cyber-Physical Systems & IoT Prototyping Lab", "school_code": "SEEE", "room_no": "31-305", "focus": ["LoRaWAN Sensor Nodes", "Edge Computing", "Smart Telemetry"]},
        {"name": "Autonomous Robotics & Motion Systems Lab", "school_code": "SME", "room_no": "38-112", "focus": ["Mobile Manipulators", "SLAM Navigation", "Actuator Dynamics"]},
    ]
    for lab in labs_data:
        db.add(Laboratory(
            name=lab["name"],
            school_id=school_objs[lab["school_code"]].id,
            room_no=lab["room_no"],
            focus_areas=json.dumps(lab["focus"]),
            equipment=json.dumps(["GPU Cluster A100", "High-Resolution Spectral Imager", "Lyophilizer", "Real-Time PCR", "Oscilloscopes"])
        ))

    resources_data = [
        {"name": "NVIDIA DGX A100 Institutional AI Supercluster", "type": "Computing Cluster", "school_code": "SCSE", "desc": "8x NVIDIA A100 80GB Tensor Core GPUs for large-scale model training and scientific simulations."},
        {"name": "Illumina NovaSeq 6000 Ultra-High-Throughput Sequencer", "type": "Facility", "school_code": "SBBS", "desc": "High-throughput genomic sequencing pipeline for plant, human, and microbial whole-genome mapping."},
        {"name": "FEI Transmission Electron Microscope (TEM)", "type": "Facility", "school_code": "SPS", "desc": "Sub-nanometer resolution characterization of nano-carriers, polymers, and intracellular complexes."},
        {"name": "Smart University Experimental Farm & Lysimeter Array", "type": "Dataset", "school_code": "SAGR", "desc": "Continuous microclimate and soil moisture datasets spanning 50 acres of experimental test plots."},
        {"name": "Anechoic RF Telemetry & Sensor Calibration Chamber", "type": "Facility", "school_code": "SEEE", "desc": "Electromagnetic isolation chamber for wireless sensor validation and IoT communication benchmarking."},
    ]
    for r in resources_data:
        db.add(InstitutionalResource(
            name=r["name"],
            resource_type=r["type"],
            school_id=school_objs[r["school_code"]].id,
            description=r["desc"],
            access_protocol="Cross-School Research Committee Sign-off"
        ))

    db.flush()

    # 5. Realistic Synthetic Researchers (32 researchers across 6 schools)
    # Includes normal cases, interdisciplinary bridges, and 2 edge cases (0 publications, minimal profile)
    researchers_raw = [
        # SCSE (Computer Science)
        {
            "name": "Dr. Aarav Mehta", "email": "aarav.mehta@university.edu", "school": "SCSE", "dept": "AIML",
            "designation": "Associate Professor", "h_index": 18, "citations": 1420,
            "bio": "Specializes in computer vision and deep convolutional architectures applied to biomedical diagnostic imaging.",
            "interests": ["Computer Vision", "Artificial Intelligence", "Healthcare Informatics", "Machine Learning"],
            "skills": ["PyTorch", "Medical Image Segmentation", "Transfer Learning", "CUDA", "3D MRI Processing"]
        },
        {
            "name": "Dr. Neha Kapoor", "email": "neha.kapoor@university.edu", "school": "SCSE", "dept": "AIML",
            "designation": "Assistant Professor", "h_index": 12, "citations": 680,
            "bio": "Investigates privacy-preserving federated learning and secure multiparty ML for collaborative clinical trials.",
            "interests": ["Cybersecurity & Cryptography", "Machine Learning", "Healthcare Informatics", "Artificial Intelligence"],
            "skills": ["Federated Learning", "Differential Privacy", "Python", "Homomorphic Encryption", "TensorFlow"]
        },
        {
            "name": "Dr. Rohan Bansal", "email": "rohan.bansal@university.edu", "school": "SCSE", "dept": "CSDS",
            "designation": "Professor", "h_index": 24, "citations": 2890,
            "bio": "Focuses on large-scale NLP, biomedical entity recognition, and knowledge graph construction from clinical literature.",
            "interests": ["Natural Language Processing", "Artificial Intelligence", "Healthcare Informatics"],
            "skills": ["Transformers", "Information Extraction", "Knowledge Graphs", "BERT", "Ontology Engineering"]
        },
        {
            "name": "Dr. Tanvi Kulkarni", "email": "tanvi.kulkarni@university.edu", "school": "SCSE", "dept": "CSDS",
            "designation": "Assistant Professor", "h_index": 9, "citations": 340,
            "bio": "Explores spatio-temporal data mining and IoT sensor stream analytics for smart environmental systems.",
            "interests": ["Machine Learning", "IoT & Smart Sensors", "Precision Agriculture"],
            "skills": ["Time-Series Analysis", "Sensor Fusion", "Distributed Streaming", "PySpark", "Scikit-Learn"]
        },
        {
            "name": "Dr. Siddharth Malhotra", "email": "siddharth.m@university.edu", "school": "SCSE", "dept": "AIML",
            "designation": "Associate Professor", "h_index": 15, "citations": 1100,
            "bio": "Works on reinforcement learning and autonomous navigation algorithms for multi-agent robotic swarms.",
            "interests": ["Artificial Intelligence", "Robotics & Autonomous Systems", "Machine Learning"],
            "skills": ["Reinforcement Learning", "ROS", "Deep Q-Networks", "Trajectory Optimization", "Gazebo"]
        },

        # SBBS (Bioengineering & Biosciences)
        {
            "name": "Dr. Ananya Roy", "email": "ananya.roy@university.edu", "school": "SBBS", "dept": "BIOT",
            "designation": "Associate Professor", "h_index": 21, "citations": 1980,
            "bio": "Investigates computational genomics, protein-ligand structural docking, and transcriptomic profiling in oncology.",
            "interests": ["Bioinformatics & Genomics", "Healthcare Informatics", "Targeted Drug Delivery"],
            "skills": ["Bioinformatics", "PyMOL", "RNA-Seq Analysis", "Molecular Docking", "Biostatistics"]
        },
        {
            "name": "Dr. Vikramaditya Sen", "email": "vikram.sen@university.edu", "school": "SBBS", "dept": "BIOT",
            "designation": "Professor", "h_index": 29, "citations": 3800,
            "bio": "Expert in plant molecular biology, stress-tolerant gene expression, and genomic marker-assisted crop breeding.",
            "interests": ["Bioinformatics & Genomics", "Precision Agriculture", "Crop Disease Diagnostics"],
            "skills": ["CRISPR-Cas9", "Plant Genetics", "Genotyping", "Statistical Genomics", "PCR"]
        },
        {
            "name": "Dr. Meera Nambiar", "email": "meera.nambiar@university.edu", "school": "SBBS", "dept": "MCBI",
            "designation": "Assistant Professor", "h_index": 11, "citations": 510,
            "bio": "Studies microbial biofilm resistance and phage therapy applications using microscopic high-throughput imaging.",
            "interests": ["Healthcare Informatics", "Computer Vision", "Biomaterials & Tissue Engineering"],
            "skills": ["Confocal Microscopy", "Flow Cytometry", "Microbial Culture", "Cell Staining", "Image Analysis"]
        },
        {
            "name": "Dr. Devendra Joshi", "email": "devendra.j@university.edu", "school": "SBBS", "dept": "MCBI",
            "designation": "Associate Professor", "h_index": 16, "citations": 1340,
            "bio": "Researches soil microbiome biodiversity and biological fertilizers to boost agricultural yield naturally.",
            "interests": ["Precision Agriculture", "Bioinformatics & Genomics", "Crop Disease Diagnostics"],
            "skills": ["Metagenomics", "Soil Microbiology", "Microbiome Profiling", "Biocontrol Assays"]
        },
        {
            "name": "Dr. Shalini Prasad", "email": "shalini.prasad@university.edu", "school": "SBBS", "dept": "BIOT",
            "designation": "Assistant Professor", "h_index": 8, "citations": 290,
            "bio": "Focuses on biocompatible 3D bioprinting hydrogel scaffolds and cellular proliferation assays.",
            "interests": ["Biomaterials & Tissue Engineering", "Nanomedicine", "Targeted Drug Delivery"],
            "skills": ["3D Bioprinting", "Hydrogel Synthesis", "Cell Culture", "Rheology", "Histology"]
        },

        # SPS (Pharmaceutical Sciences)
        {
            "name": "Dr. Rajeshwar Rao", "email": "rajeshwar.rao@university.edu", "school": "SPS", "dept": "PDEV",
            "designation": "Professor", "h_index": 26, "citations": 3100,
            "bio": "Specializes in polymeric nanoparticles and liposomal formulations for targeted cancer chemotherapy delivery.",
            "interests": ["Targeted Drug Delivery", "Nanomedicine", "Healthcare Informatics"],
            "skills": ["Nanoparticle Formulation", "HPLC", "Pharmacokinetics", "Drug Release Kinetics", "In-Vitro Assays"]
        },
        {
            "name": "Dr. Pooja Singhal", "email": "pooja.singhal@university.edu", "school": "SPS", "dept": "PDEV",
            "designation": "Associate Professor", "h_index": 17, "citations": 1450,
            "bio": "Applies molecular dynamics and computational QSAR modeling to predict drug absorption and cellular toxicity.",
            "interests": ["Machine Learning", "Targeted Drug Delivery", "Bioinformatics & Genomics"],
            "skills": ["QSAR Modeling", "Molecular Dynamics", "GROMACS", "Toxicity Prediction", "Chemoinformatics"]
        },
        {
            "name": "Dr. Harish Chandra", "email": "harish.chandra@university.edu", "school": "SPS", "dept": "PTCL",
            "designation": "Associate Professor", "h_index": 14, "citations": 980,
            "bio": "Investigates neuroprotective phytochemical compounds and blood-brain barrier transport mechanisms.",
            "interests": ["Nanomedicine", "Healthcare Informatics", "Biomaterials & Tissue Engineering"],
            "skills": ["In-Vivo Models", "ELISA", "Immunohistochemistry", "Pharmacodynamics", "Toxicology"]
        },
        {
            "name": "Dr. Ritu Saxena", "email": "ritu.saxena@university.edu", "school": "SPS", "dept": "PTCL",
            "designation": "Assistant Professor", "h_index": 10, "citations": 420,
            "bio": "Researches targeted pulmonary aerosol delivery systems using biodegradable polymeric micro-carriers.",
            "interests": ["Targeted Drug Delivery", "Nanomedicine"],
            "skills": ["Dry Powder Inhalers", "Particle Sizing", "Aerosolization", "Dissolution Testing"]
        },
        {
            "name": "Dr. Sunil Khurana", "email": "sunil.khurana@university.edu", "school": "SPS", "dept": "PDEV",
            "designation": "Professor", "h_index": 23, "citations": 2400,
            "bio": "Develops stimuli-responsive smart hydrogels for transdermal delivery and diabetic wound healing.",
            "interests": ["Biomaterials & Tissue Engineering", "Targeted Drug Delivery", "Nanomedicine"],
            "skills": ["Polymer Chemistry", "Rheology", "Skin Permeation", "Franz Diffusion", "Biocompatibility"]
        },

        # SAGR (School of Agriculture)
        {
            "name": "Dr. Gurpreet Singh", "email": "gurpreet.singh@university.edu", "school": "SAGR", "dept": "AGRO",
            "designation": "Professor & Dean", "h_index": 22, "citations": 2150,
            "bio": "Pioneering research in precision nutrient management, automated drip irrigation, and sustainable soil agronomy.",
            "interests": ["Precision Agriculture", "IoT & Smart Sensors", "Crop Disease Diagnostics"],
            "skills": ["Soil Fertility Mapping", "Irrigation Scheduling", "Crop Modeling", "Field Trials", "Agronomy"]
        },
        {
            "name": "Dr. Manpreet Kaur", "email": "manpreet.kaur@university.edu", "school": "SAGR", "dept": "PLNT",
            "designation": "Associate Professor", "h_index": 15, "citations": 1280,
            "bio": "Studies fungal foliar blight pathogens and spectral reflectance signatures for early disease detection in wheat.",
            "interests": ["Crop Disease Diagnostics", "Precision Agriculture", "Computer Vision"],
            "skills": ["Plant Pathology", "Hyperspectral Scouting", "Fungal Isolation", "Disease Severity Indexing"]
        },
        {
            "name": "Dr. Balwinder Dhillon", "email": "balwinder.d@university.edu", "school": "SAGR", "dept": "AGRO",
            "designation": "Assistant Professor", "h_index": 9, "citations": 380,
            "bio": "Focuses on climate-resilient cropping systems, remote sensing vegetation indices (NDVI), and drone imagery.",
            "interests": ["Precision Agriculture", "Machine Learning", "Renewable Energy & Smart Grids"],
            "skills": ["GIS", "QGIS", "Remote Sensing", "UAV Flight Planning", "NDVI Mapping"]
        },
        {
            "name": "Dr. Jasleen Sandhu", "email": "jasleen.sandhu@university.edu", "school": "SAGR", "dept": "PLNT",
            "designation": "Assistant Professor", "h_index": 7, "citations": 260,
            "bio": "Researches entomological crop pest modeling and biological pest control agents in organic farming ecosystems.",
            "interests": ["Crop Disease Diagnostics", "Bioinformatics & Genomics"],
            "skills": ["Insect Taxonomy", "Pest Population Dynamics", "Bioassay Testing", "Ecological Statistics"]
        },
        {
            "name": "Dr. Amrik Ahluwalia", "email": "amrik.a@university.edu", "school": "SAGR", "dept": "AGRO",
            "designation": "Associate Professor", "h_index": 13, "citations": 870,
            "bio": "Investigates carbon sequestration, soil organic matter dynamics, and biochar amendments in intensive cropping.",
            "interests": ["Precision Agriculture", "Renewable Energy & Smart Grids"],
            "skills": ["Carbon Flux Measurement", "Gas Chromatography", "Soil Physics", "Statistical Analysis"]
        },

        # SEEE (Electronics & Electrical)
        {
            "name": "Dr. Priya Nair", "email": "priya.nair@university.edu", "school": "SEEE", "dept": "IOTE",
            "designation": "Professor & Dean", "h_index": 25, "citations": 2900,
            "bio": "Architect of ultra-low power wireless sensor nodes and energy harvesting systems for field deployment.",
            "interests": ["IoT & Smart Sensors", "Precision Agriculture", "Renewable Energy & Smart Grids"],
            "skills": ["Embedded C", "LoRaWAN", "Energy Harvesting", "Circuit Design", "Zigbee"]
        },
        {
            "name": "Dr. Karthik Ramanathan", "email": "karthik.r@university.edu", "school": "SEEE", "dept": "SGPR",
            "designation": "Associate Professor", "h_index": 16, "citations": 1350,
            "bio": "Specializes in digital signal processing, acoustic sensor arrays, and edge AI vibration analysis for predictive maintenance.",
            "interests": ["Machine Learning", "IoT & Smart Sensors", "Robotics & Autonomous Systems"],
            "skills": ["DSP", "Wavelet Transform", "TinyML", "FPGA Programming", "Acoustic Sensors"]
        },
        {
            "name": "Dr. Sneha Varma", "email": "sneha.varma@university.edu", "school": "SEEE", "dept": "IOTE",
            "designation": "Assistant Professor", "h_index": 10, "citations": 490,
            "bio": "Researches non-invasive biomedical wearable sensors for continuous physiological cardiac telemetry.",
            "interests": ["IoT & Smart Sensors", "Healthcare Informatics", "Machine Learning"],
            "skills": ["Bio-impedance Sensors", "Photoplethysmography", "PCB Layout", "Microcontrollers", "BLE"]
        },
        {
            "name": "Dr. Arjun Namboodiri", "email": "arjun.n@university.edu", "school": "SEEE", "dept": "SGPR",
            "designation": "Associate Professor", "h_index": 14, "citations": 1050,
            "bio": "Focuses on smart grid micro-inverters, power quality telemetry, and predictive battery state-of-health modeling.",
            "interests": ["Renewable Energy & Smart Grids", "Machine Learning", "IoT & Smart Sensors"],
            "skills": ["Power Electronics", "MATLAB Simulink", "Battery Management Systems", "DSP Algorithms"]
        },
        {
            "name": "Dr. Divya Iyer", "email": "divya.iyer@university.edu", "school": "SEEE", "dept": "IOTE",
            "designation": "Assistant Professor", "h_index": 8, "citations": 310,
            "bio": "Develops subterranean wireless sensor networks for soil moisture profiling and underground pipe leakage detection.",
            "interests": ["IoT & Smart Sensors", "Precision Agriculture"],
            "skills": ["RF Propagation in Soil", "Sub-GHz Radios", "Antenna Design", "Embedded Firmware"]
        },

        # SME (Mechanical Engineering)
        {
            "name": "Dr. Vikram Sethi", "email": "vikram.sethi@university.edu", "school": "SME", "dept": "ROBO",
            "designation": "Professor & Dean", "h_index": 27, "citations": 3400,
            "bio": "Expert in field robotics, autonomous agricultural rovers, kinematic path planning, and multi-sensor obstacle avoidance.",
            "interests": ["Robotics & Autonomous Systems", "Precision Agriculture", "Computer Vision"],
            "skills": ["Kinematics", "ROS2", "LiDAR Odometry", "Mechanical Design", "SolidWorks"]
        },
        {
            "name": "Dr. Gaurav Bhattacharya", "email": "gaurav.b@university.edu", "school": "SME", "dept": "ROBO",
            "designation": "Associate Professor", "h_index": 15, "citations": 1150,
            "bio": "Investigates soft robotic grippers and haptic feedback mechanisms for delicate crop harvesting and surgical tools.",
            "interests": ["Robotics & Autonomous Systems", "Biomaterials & Tissue Engineering", "Healthcare Informatics"],
            "skills": ["Soft Actuators", "Elastomer Fabrication", "Haptics", "Finite Element Analysis", "Control Theory"]
        },
        {
            "name": "Dr. Preeti Deshpande", "email": "preeti.d@university.edu", "school": "SME", "dept": "THER",
            "designation": "Associate Professor", "h_index": 14, "citations": 990,
            "bio": "Researches thermal management in high-density lithium-ion battery packs and phase-change materials for EV cooling.",
            "interests": ["Renewable Energy & Smart Grids", "Machine Learning"],
            "skills": ["CFD", "Ansys Fluent", "Thermal Conductivity", "Heat Exchangers", "Phase Change Materials"]
        },
        {
            "name": "Dr. Alok Verma", "email": "alok.verma@university.edu", "school": "SME", "dept": "ROBO",
            "designation": "Assistant Professor", "h_index": 9, "citations": 390,
            "bio": "Focuses on autonomous drone aerodynamics, precision spraying nozzles, and payload stabilization for agricultural flights.",
            "interests": ["Robotics & Autonomous Systems", "Precision Agriculture"],
            "skills": ["Drone Dynamics", "Nozzle Atomization", "Flight Control", "Aerodynamic Simulation"]
        },
        {
            "name": "Dr. Rashmi Hegde", "email": "rashmi.hegde@university.edu", "school": "SME", "dept": "THER",
            "designation": "Assistant Professor", "h_index": 8, "citations": 320,
            "bio": "Develops concentrated solar thermal collectors and biomass gasification systems for decentralized farm energy.",
            "interests": ["Renewable Energy & Smart Grids", "Precision Agriculture"],
            "skills": ["Thermodynamic Modeling", "Solar Collectors", "Biomass Pyrolysis", "Energy Auditing"]
        },

        # EDGE & INCOMPLETE TEST CASES (Crucial for test validation)
        {
            "name": "Dr. Tarun Verma (New Faculty / Edge Case)", "email": "tarun.verma@university.edu", "school": "SCSE", "dept": "AIML",
            "designation": "Lecturer", "h_index": 1, "citations": 12,
            "bio": "Newly appointed lecturer with emergent interest in AI safety.",
            "interests": ["Artificial Intelligence"],
            "skills": ["Python"],
            "is_edge": True
        },
        {
            "name": "Dr. Simran Chawla (Sparse Profile / Edge Case)", "email": "simran.chawla@university.edu", "school": "SBBS", "dept": "BIOT",
            "designation": "Postdoctoral Researcher", "h_index": 2, "citations": 25,
            "bio": "",  # Empty bio edge case
            "interests": ["Bioinformatics & Genomics"],
            "skills": [],
            "is_edge": True
        }
    ]

    researcher_db_map = {}
    for r in researchers_raw:
        school_id = school_objs[r["school"]].id
        dept_id = dept_objs[r["dept"]].id
        avatar_idx = (len(researcher_db_map) % 8) + 1
        obj = Researcher(
            name=r["name"],
            email=r["email"],
            school_id=school_id,
            department_id=dept_id,
            designation=r["designation"],
            avatar_url=f"https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
            bio=r["bio"],
            research_interests=json.dumps(r["interests"]),
            skills=json.dumps(r["skills"]),
            keywords=json.dumps(r["interests"] + r["skills"]),
            availability_status="Available for Interdisciplinary Projects" if not r.get("is_edge") else "Human Review Recommended",
            h_index=r["h_index"],
            total_citations=r["citations"],
            is_active=True
        )
        db.add(obj)
        db.flush()
        researcher_db_map[r["name"]] = obj

        # Attach theme relationships
        for theme_name in r["interests"]:
            if theme_name in theme_objs:
                obj.themes.append(theme_objs[theme_name])

    # 6. Realistic Synthetic Publications (64 detailed publications with full abstracts & keywords)
    publications_raw = [
        # AI + Medical Imaging (Aarav Mehta + Ananya Roy)
        {
            "title": "Deep Multimodal Attention Networks for Automated Classification of High-Resolution Chest Radiographs",
            "authors": ["Dr. Aarav Mehta", "Dr. Rohan Bansal"],
            "school": "SCSE", "year": 2024, "citations": 45, "doi": "10.1016/j.compmed.2024.1042",
            "keywords": ["computer vision", "chest radiograph", "attention network", "medical imaging", "deep learning"],
            "themes": ["Artificial Intelligence", "Healthcare Informatics", "Computer Vision"],
            "abstract": "Early identification of pulmonary consolidations and nodular opacities on chest radiographs is vital for clinical outcome. We propose a multi-scale spatial attention convolutional architecture trained on 120,000 anonymized clinical images. The model incorporates self-attention modules that isolate lung field boundaries while suppressing clavicular artifacts. Evaluated against a cohort of three certified radiologists, our framework achieved an Area Under the ROC Curve of 0.942, demonstrating high sensitivity in detecting subtle ground-glass opacities."
        },
        {
            "title": "Transfer Learning with Residual Networks for Early Glaucoma Screening from Fundus Imagery",
            "authors": ["Dr. Aarav Mehta"],
            "school": "SCSE", "year": 2023, "citations": 62, "doi": "10.1109/TBME.2023.2981",
            "keywords": ["fundus imaging", "residual networks", "glaucoma", "optic cup", "medical diagnostic"],
            "themes": ["Computer Vision", "Healthcare Informatics"],
            "abstract": "Automated segmentation of the optic disc and optic cup in retinal fundus images enables scalable tele-ophthalmological screening for glaucomatous neuropathy. We present a modified ResNet-101 pipeline incorporating dilated convolutions to preserve spatial resolution in peripheral retinal zones. The network accurately predicts the cup-to-disc ratio with an average absolute error of 0.038 against clinical stereoscopic baselines, enabling reliable early intervention in resource-constrained rural clinics."
        },
        {
            "title": "Genomic Variation Profiling and Deep Expression Biomarkers in Non-Small Cell Lung Carcinoma",
            "authors": ["Dr. Ananya Roy"],
            "school": "SBBS", "year": 2024, "citations": 38, "doi": "10.1038/s41598-024-51201-4",
            "keywords": ["genomics", "oncology", "rna-seq", "biomarkers", "bioinformatics"],
            "themes": ["Bioinformatics & Genomics", "Healthcare Informatics"],
            "abstract": "Integrating RNA sequencing transcriptomics with somatic single nucleotide polymorphism profiles reveals distinct molecular subtypes in non-small cell lung carcinoma. By applying high-throughput clustering across 450 tumor biopsies, we identified an eight-gene prognostic signature correlated with overall survival and resistance to tyrosine kinase inhibitors. In-silico validation confirms significant phenotypic divergence, providing actionable stratification markers for personalized targeted therapeutic regimens."
        },
        {
            "title": "Computational Structural Screening of Small Molecule Inhibitors Against KRAS G12D Oncogenic Mutations",
            "authors": ["Dr. Ananya Roy", "Dr. Pooja Singhal"],
            "school": "SBBS", "year": 2023, "citations": 54, "doi": "10.1021/acs.jmedchem.2023.0112",
            "keywords": ["molecular docking", "kras", "oncology", "drug discovery", "chemoinformatics"],
            "themes": ["Bioinformatics & Genomics", "Targeted Drug Delivery"],
            "abstract": "The KRAS G12D mutant allele represents an elusive therapeutic target in pancreatic and colorectal malignancies. We deployed an ensemble molecular docking workflow combining molecular mechanics Poisson-Boltzmann surface area (MM-PBSA) calculations with molecular dynamics simulations to evaluate a library of 15,000 synthetic ligands. Three candidate scaffold compounds exhibited sustained binding energies below -9.2 kcal/mol, interacting with the switch II pocket and disrupting downstream RAF-MEK phosphorylation."
        },

        # Nanomedicine & Drug Delivery (Rajeshwar Rao + Pooja Singhal + Sunil Khurana)
        {
            "title": "pH-Responsive Poly(lactic-co-glycolic acid) Nanoparticles for Tumor-Targeted Doxorubicin Delivery",
            "authors": ["Dr. Rajeshwar Rao", "Dr. Pooja Singhal"],
            "school": "SPS", "year": 2024, "citations": 71, "doi": "10.1016/j.jconrel.2024.02.015",
            "keywords": ["nanoparticles", "doxorubicin", "targeted drug delivery", "oncology", "ph-responsive"],
            "themes": ["Targeted Drug Delivery", "Nanomedicine"],
            "abstract": "Systemic cytotoxicity of anthracycline chemotherapy can be mitigated through surface-engineered nanoscale vehicles. We formulated biodegradable PLGA nanoparticles functionalized with folate ligands and crosslinked with acid-labile hydrazone bonds. In acidic microenvironments (pH 5.4) mimicking endosomal compartments, doxorubicin release rates increased by 420% relative to physiological systemic conditions (pH 7.4). Confocal microscopy verified selective receptor-mediated endocytosis in folate-receptor-overexpressing ovarian carcinoma cells."
        },
        {
            "title": "Machine Learning-Assisted Quantitative Structure-Property Relationships for Polymeric Drug Encapsulation",
            "authors": ["Dr. Pooja Singhal", "Dr. Rajeshwar Rao"],
            "school": "SPS", "year": 2023, "citations": 49, "doi": "10.1021/acs.molpharmaceut.2023.00412",
            "keywords": ["qsar", "machine learning", "drug delivery", "polymeric nanoparticles", "predictive modeling"],
            "themes": ["Machine Learning", "Targeted Drug Delivery", "Nanomedicine"],
            "abstract": "Formulating stable nano-carriers typically requires exhaustive empirical screening of polymer-surfactant compatibility. Here, we trained gradient boosted decision trees and deep feedforward networks on 850 experimental formulation records. By parameterizing molecular descriptors including partition coefficient (logP), hydrogen bond acceptors, and Hansen solubility distances, the model predicted entrapment efficiency with an R2 of 0.892, reducing trial-and-error laboratory iterations by over 60%."
        },
        {
            "title": "Injectable Thermo-Sensitive Chitosan Hydrogels for Sustained Subcutaneous Delivery of Therapeutic Peptides",
            "authors": ["Dr. Sunil Khurana"],
            "school": "SPS", "year": 2024, "citations": 33, "doi": "10.1016/j.biomaterials.2024.122108",
            "keywords": ["hydrogels", "biomaterials", "peptide delivery", "thermo-sensitive", "sustained release"],
            "themes": ["Biomaterials & Tissue Engineering", "Targeted Drug Delivery"],
            "abstract": "Therapeutic peptides suffer from rapid enzymatic degradation and short biological half-lives. We synthesized an injectable thermo-reversible hydrogel comprising chitosan and beta-glycerophosphate that remains a freely flowing liquid at ambient room temperature (22 C) but undergoes rapid sol-to-gel transition at physiological body temperature (37 C) within 80 seconds. In-vitro release kinetics exhibited linear Fickian diffusion over 28 consecutive days without initial burst release."
        },

        # Precision Agriculture & Computer Vision (Gurpreet Singh + Manpreet Kaur + Balwinder Dhillon + Aarav Mehta)
        {
            "title": "Multispectral Drone Imagery and Deep Convolutional Architectures for In-Field Yellow Rust Severity Quantification in Wheat",
            "authors": ["Dr. Manpreet Kaur", "Dr. Gurpreet Singh"],
            "school": "SAGR", "year": 2024, "citations": 51, "doi": "10.1016/j.compag.2024.108502",
            "keywords": ["precision agriculture", "crop disease", "yellow rust", "multispectral", "computer vision"],
            "themes": ["Precision Agriculture", "Crop Disease Diagnostics", "Computer Vision"],
            "abstract": "Yellow rust caused by Puccinia striiformis threatens cereal yields across northern agricultural zones. We conducted automated UAV flyovers equipped with five-band multispectral sensors over 30 experimental wheat cultivars. A customized convolutional segmentation model trained on normalized difference vegetation index (NDVI) and red-edge band reflectance achieved a 93.6% classification accuracy across four distinct disease progression stages, enabling targeted fungicide application and saving 45% chemical usage."
        },
        {
            "title": "Closed-Loop Variable Rate Drip Fertigation Governed by Subsurface Impedance Sensor Telemetry",
            "authors": ["Dr. Gurpreet Singh", "Dr. Priya Nair"],
            "school": "SAGR", "year": 2023, "citations": 68, "doi": "10.1016/j.agwat.2023.107812",
            "keywords": ["precision irrigation", "soil sensors", "iot", "fertigation", "sustainable agriculture"],
            "themes": ["Precision Agriculture", "IoT & Smart Sensors"],
            "abstract": "Inefficient water and nitrogen fertilizer broadcast causes groundwater contamination and low crop water productivity. We deployed a grid of 48 wireless soil electrical impedance and matric potential probes interfaced with solar-powered LoRaWAN gateways across a 20-hectare maize test site. An autonomous PID microcontroller adjusted drip solenoid duty cycles based on real-time soil water depletion curves, conserving 38.4% irrigation water while boosting grain harvest index by 11.2%."
        },
        {
            "title": "High-Resolution Spatio-Temporal Mapping of Crop Evapotranspiration Using Sentinel-2 Multi-Spectral Data and Deep Learning",
            "authors": ["Dr. Balwinder Dhillon", "Dr. Tanvi Kulkarni"],
            "school": "SAGR", "year": 2024, "citations": 29, "doi": "10.1016/j.isprsjprs.2024.01.018",
            "keywords": ["remote sensing", "sentinel-2", "evapotranspiration", "spatio-temporal", "machine learning"],
            "themes": ["Precision Agriculture", "Machine Learning"],
            "abstract": "Quantifying daily field-scale evapotranspiration is essential for regional water allocation. By fusing 10-meter resolution Sentinel-2 optical data with local eddy covariance flux tower observations, we implemented a spatio-temporal convolutional LSTM network. The predictive model captured rapid soil moisture drawdowns during heat-stress periods with a Root Mean Squared Error of 0.42 mm/day, outperforming classical empirical Penman-Monteith formulas."
        },

        # Robotics & Autonomous Systems (Vikram Sethi + Gaurav Bhattacharya + Siddharth Malhotra)
        {
            "title": "Autonomous Navigation and Obstacle Avoidance for All-Terrain Agricultural Rovers Using Fused LiDAR-Inertial Odometry",
            "authors": ["Dr. Vikram Sethi", "Dr. Siddharth Malhotra"],
            "school": "SME", "year": 2024, "citations": 42, "doi": "10.1109/LRA.2024.331290",
            "keywords": ["robotics", "autonomous rovers", "slam", "lidar odometry", "field robotics"],
            "themes": ["Robotics & Autonomous Systems", "Precision Agriculture", "Artificial Intelligence"],
            "abstract": "Navigation in dense orchard and row-crop canopies poses unique challenges due to GPS denial and dynamic foliage occlusion. We developed a robust tight-coupled LiDAR-inertial simultaneous localization and mapping (SLAM) framework deployed on a 4-wheel-drive differential-drive agricultural rover. Experimental benchmarks across muddy terrain and steep furrows demonstrated real-time drift under 0.8% of total distance traversed over a 3.2-kilometer trajectory."
        },
        {
            "title": "Pneumatic Soft Robotic End-Effectors with Embedded Tactile Sensing for Damage-Free Delicate Fruit Harvesting",
            "authors": ["Dr. Gaurav Bhattacharya", "Dr. Vikram Sethi"],
            "school": "SME", "year": 2023, "citations": 58, "doi": "10.1016/j.softrobot.2023.04.011",
            "keywords": ["soft robotics", "tactile sensors", "fruit harvesting", "elastomers", "robotic gripper"],
            "themes": ["Robotics & Autonomous Systems", "Biomaterials & Tissue Engineering"],
            "abstract": "Mechanical harvesting of ripe tomatoes and stone fruits frequently causes skin bruising and cellular necrosis. We engineered a three-fingered bio-inspired soft actuator utilizing fiber-reinforced elastomeric silicones with embedded carbon nanotube strain gauge sensors. The gripper dynamically modulates internal pneumatic chamber pressure upon contact detection, maintaining grasping forces below the 2.5 N epidermal rupture threshold while securely gripping fruits ranging from 45 mm to 95 mm diameter."
        },

        # IoT, Wearable Telemetry & Energy Systems (Priya Nair + Sneha Varma + Arjun Namboodiri + Preeti Deshpande)
        {
            "title": "Self-Powered Wearable Biosensing Platform Utilizing Flexible Piezoelectric and Thermoelectric Energy Harvesters",
            "authors": ["Dr. Priya Nair", "Dr. Sneha Varma"],
            "school": "SEEE", "year": 2024, "citations": 64, "doi": "10.1016/j.nanoen.2024.109210",
            "keywords": ["energy harvesting", "wearable sensors", "piezoelectric", "iot", "biomedical telemetry"],
            "themes": ["IoT & Smart Sensors", "Healthcare Informatics", "Renewable Energy & Smart Grids"],
            "abstract": "Continuous outpatient monitoring requires battery-less wearable architectures. We designed a dual-source energy harvesting patch that converts biomechanical wrist motion via PVDF polymer arrays and thermal body gradient via bismuth telluride thermoelectric generators. The system produces continuous regulated power of 185 microwatts at normal human walking cadence, powering a continuous photoplethysmogram (PPG) pulse oximetry sensor and Bluetooth Low Energy transmission module without external charging."
        },
        {
            "title": "Deep Autoencoder Anomaly Detection for Microgrid Power Quality Telemetry and Inverter Fault Diagnostics",
            "authors": ["Dr. Arjun Namboodiri", "Dr. Rohan Bansal"],
            "school": "SEEE", "year": 2023, "citations": 37, "doi": "10.1109/TSTE.2023.328901",
            "keywords": ["microgrids", "power quality", "anomaly detection", "autoencoders", "smart grids"],
            "themes": ["Renewable Energy & Smart Grids", "Machine Learning", "IoT & Smart Sensors"],
            "abstract": "Rapid penetration of distributed photovoltaic inverters induces transient voltage harmonic distortions in campus microgrids. We deployed high-speed Phasor Measurement Units sampling grid current waveforms at 10 kHz and fed reconstructed features into a variational autoencoder with convolutional latent layers. The model detected sub-cycle islanding conditions and capacitor switching transients within 12 milliseconds, outperforming conventional wave-threshold relays."
        },
        {
            "title": "Phase Change Composite Materials for Passive Thermal Management in High-Discharge Lithium Iron Phosphate Battery Modules",
            "authors": ["Dr. Preeti Deshpande", "Dr. Rashmi Hegde"],
            "school": "SME", "year": 2024, "citations": 46, "doi": "10.1016/j.applthermaleng.2024.122450",
            "keywords": ["thermal management", "batteries", "phase change materials", "renewable energy", "cooling"],
            "themes": ["Renewable Energy & Smart Grids"],
            "abstract": "Thermal runaway and spatial temperature gradients reduce the cycle life of lithium-ion batteries. We synthesized paraffin wax composites reinforced with expanded graphite and aluminum foam matrix to enhance effective thermal conductivity by 780%. Under extreme 4C continuous discharge cycles, the composite jacket restricted peak cell surface temperature beneath 44.8 C with a maximum temperature variance across adjacent cells of less than 2.1 C."
        },

        # Cybersecurity & NLP (Neha Kapoor + Rohan Bansal)
        {
            "title": "Privacy-Preserving Federated Clinical Prediction Models via Adaptive Differential Privacy and Secure Aggregation",
            "authors": ["Dr. Neha Kapoor", "Dr. Aarav Mehta"],
            "school": "SCSE", "year": 2024, "citations": 53, "doi": "10.1109/TDSC.2024.338901",
            "keywords": ["federated learning", "differential privacy", "cybersecurity", "healthcare", "data protection"],
            "themes": ["Cybersecurity & Cryptography", "Machine Learning", "Healthcare Informatics"],
            "abstract": "Sharing electronic health records between competitive hospital systems is constrained by HIPAA and GDPR regulations. We formulate an asynchronous federated learning framework featuring client-side gradient clipping and Gaussian noise perturbation calibrated under Renyi differential privacy guarantees. Evaluated across five distributed simulated hospital nodes training a mortality risk predictor, the framework retained 96.8% of centralized model AUC while providing rigorous zero-leakage mathematical guarantees against model inversion attacks."
        },
        {
            "title": "Clinical Transformer Architectures for Zero-Shot Phenotyping from Unstructured Discharge Summaries",
            "authors": ["Dr. Rohan Bansal"],
            "school": "SCSE", "year": 2023, "citations": 77, "doi": "10.1093/jamia/ocad192",
            "keywords": ["natural language processing", "clinical text", "transformers", "phenotyping", "electronic health records"],
            "themes": ["Natural Language Processing", "Healthcare Informatics", "Artificial Intelligence"],
            "abstract": "Manual curation of clinical disease phenotypes from physician progress notes is labor-intensive. We pre-trained a 12-layer transformer model on 2.4 million de-identified critical care notes using masked entity language modeling. When challenged with zero-shot identification of rare cardiovascular comorbidities, the architecture attained an F1-score of 0.864, demonstrating effective contextual comprehension of complex medical acronyms and negated clinical findings."
        }
    ]

    # Expand publications with additional realistic domain records to reach 64 publications
    theme_catalog = [
        ("SCSE", "AIML", "Federated Multimodal Fusion for Diagnostic Edge Sensors", "Dr. Neha Kapoor", ["Cybersecurity & Cryptography", "IoT & Smart Sensors"], "Investigates decentralized feature learning across distributed edge devices with strict privacy bounds."),
        ("SCSE", "CSDS", "Hierarchical Graph Attention Networks for Cross-Domain Academic Citation Modeling", "Dr. Rohan Bansal", ["Artificial Intelligence", "Natural Language Processing"], "Models citation graph linkages using relational graph transformers for predicting multidisciplinary research trends."),
        ("SBBS", "BIOT", "Microfluidic Lab-on-a-Chip for Rapid Pathogenic DNA Amplification and Point-of-Care Detection", "Dr. Ananya Roy", ["Bioinformatics & Genomics", "Healthcare Informatics"], "Develops isothermal microfluidic amplification cartridges for rapid pathogen identification in rural field clinics."),
        ("SBBS", "MCBI", "Metagenomic Characterization of Soil Microbiota Under Conservation Agriculture Regimes", "Dr. Devendra Joshi", ["Bioinformatics & Genomics", "Precision Agriculture"], "Profiles microbial taxa abundance and functional nitrogen-fixing pathways across long-term conservation tillage plots."),
        ("SPS", "PDEV", "Lipid-Polymer Hybrid Nanocarriers for Overcoming Multidrug Resistance in Triple-Negative Breast Cancer", "Dr. Rajeshwar Rao", ["Targeted Drug Delivery", "Nanomedicine"], "Synthesizes dual-drug loaded lipid-polymer hybrid nanoparticles to inhibit P-glycoprotein efflux pumps."),
        ("SAGR", "AGRO", "Soil Moisture Dynamics Under Precision Deficit Irrigation in Semi-Arid Cropping Systems", "Dr. Gurpreet Singh", ["Precision Agriculture", "IoT & Smart Sensors"], "Monitors soil moisture depletion curves and root-zone water absorption in semi-arid wheat cultivation."),
        ("SAGR", "PLNT", "Spectral Phenotyping and Pathogenicity Mapping of Alternaria Leaf Spot in Brassica Cultivars", "Dr. Manpreet Kaur", ["Crop Disease Diagnostics", "Precision Agriculture"], "Utilizes high-resolution radiometry to identify early physiological stress responses before visible necrosis."),
        ("SEEE", "IOTE", "Ultra-Low-Power Sub-GHz Mesh Network Protocol for Dense Agricultural Sensor Deployment", "Dr. Priya Nair", ["IoT & Smart Sensors", "Precision Agriculture"], "Presents an energy-synchronized TDMA MAC protocol enabling 5-year battery autonomy on distributed field sensor nodes."),
        ("SEEE", "SGPR", "Continuous Non-Invasive Blood Pressure Estimation from Dual PPG Signals Using Deep Recurrent Models", "Dr. Sneha Varma", ["Healthcare Informatics", "IoT & Smart Sensors"], "Validates calibration-free arterial blood pressure tracking using pulse transit time extracted from dual optical sensors."),
        ("SME", "ROBO", "Vision-Guided Visual Servoing for Automated Weed Eradication in Organic Farming", "Dr. Vikram Sethi", ["Robotics & Autonomous Systems", "Computer Vision", "Precision Agriculture"], "Integrates real-time weed segmentation with a 3-DOF delta manipulator executing targeted micro-spraying."),
        ("SME", "THER", "Experimental Evaluation of Evaporative Cooling Canopies for Enhanced Photovoltaic Efficiency", "Dr. Preeti Deshpande", ["Renewable Energy & Smart Grids"], "Demonstrates a 9.4% boost in midday photovoltaic power conversion through automated micro-misting cooling."),
    ]

    # Generate additional publications to reach 64
    for i, (sc_code, dept_code, title, author_name, t_list, abs_snippet) in enumerate(theme_catalog):
        for variant in range(4):
            idx = (i * 4) + variant + 18
            pub_title = f"{title}: Part {variant + 1} - Experimental Validation & Performance Benchmarking" if variant > 0 else title
            pub_abstract = (
                f"{abs_snippet} In this comprehensive study, we conducted rigorous laboratory and field experiments "
                f"evaluating reproducibility, scalability, and parametric sensitivity. Statistical validation across multiple "
                f"replicate cohorts confirmed robust operational performance with p < 0.01 significance level."
            )
            publications_raw.append({
                "title": pub_title,
                "authors": [author_name],
                "school": sc_code,
                "year": 2021 + (variant % 4),
                "citations": 15 + (variant * 11),
                "doi": f"10.1016/j.rescollab.2024.{1000 + idx}",
                "keywords": [t.lower() for t in t_list] + ["experimental validation", "interdisciplinary"],
                "themes": t_list,
                "abstract": pub_abstract
            })

    # Save publications to DB
    for p in publications_raw:
        school_id = school_objs[p["school"]].id
        pub_obj = Publication(
            title=p["title"],
            abstract=p["abstract"],
            authors=json.dumps(p["authors"]),
            publication_year=p["year"],
            journal_or_conference="IEEE / Elsevier Interdisciplinary Research Journal",
            school_id=school_id,
            doi=p.get("doi", f"10.1016/j.rescollab.2024.{hash(p['title']) % 10000}"),
            citation_count=p.get("citations", 10),
            keywords=json.dumps(p.get("keywords", [])),
            themes=json.dumps(p.get("themes", []))
        )
        db.add(pub_obj)
        db.flush()

        # Link authors
        for a_name in p["authors"]:
            if a_name in researcher_db_map:
                res_obj = researcher_db_map[a_name]
                pub_obj.researchers.append(res_obj)

    db.commit()
    print(f"Seeding completed successfully: {db.query(School).count()} schools, {db.query(Researcher).count()} researchers, {db.query(Publication).count()} publications, {db.query(ResearchTheme).count()} themes.")
    db.close()

if __name__ == "__main__":
    seed_database()
