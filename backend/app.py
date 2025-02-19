import os
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import bcrypt
from dotenv import load_dotenv
from flask_migrate import Migrate
from prometheus_flask_exporter import PrometheusMetrics
import logging
from logging.handlers import RotatingFileHandler

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s: %(message)s'
)
handler = RotatingFileHandler('/app/logs/backend.log', maxBytes=10000000, backupCount=5)
handler.setFormatter(logging.Formatter(
    '%(asctime)s %(levelname)s: %(message)s'
))

app = Flask(__name__)
CORS(app)
app.logger.addHandler(handler)

# Initialize Prometheus metrics
metrics = PrometheusMetrics(app)
metrics.info('app_info', 'Application info', version='1.0.0')

# Custom metrics
request_counter = metrics.counter(
    'request_count', 'Request count by endpoint',
    labels={'endpoint': lambda: request.endpoint}
)
db_query_duration = metrics.histogram(
    'database_query_duration_seconds',
    'Database query duration'
)

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URI')
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
db = SQLAlchemy(app)
migrate = Migrate(app, db)

# Models remain the same...
class User(db.Model):
    # ... existing User model ...

class Product(db.Model):
    # ... existing Product model ...

# Modified routes with logging and metrics
@app.route('/signup', methods=['POST'])
@request_counter
def signup():
    app.logger.info('New signup request received')
    try:
        data = request.json
        hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        new_user = User(username=data['username'], email=data['email'], password_hash=hashed_password)
        db.session.add(new_user)
        db.session.commit()
        app.logger.info(f'User {data["username"]} registered successfully')
        return jsonify({'message': 'User registered successfully!'})
    except Exception as e:
        app.logger.error(f'Signup failed: {str(e)}')
        return jsonify({'message': 'Registration failed!'}), 500

@app.route('/login', methods=['POST'])
@request_counter
def login():
    app.logger.info('Login attempt received')
    try:
        data = request.json
        user = User.query.filter_by(email=data['email']).first()
        if not user or not bcrypt.checkpw(data['password'].encode('utf-8'), user.password_hash.encode('utf-8')):
            app.logger.warning(f'Failed login attempt for email: {data["email"]}')
            return jsonify({'message': 'Invalid email or password!'}), 401
        app.logger.info(f'Successful login for user: {user.username}')
        return jsonify({'message': f'Welcome, {user.username}!'})
    except Exception as e:
        app.logger.error(f'Login error: {str(e)}')
        return jsonify({'message': 'Login failed!'}), 500

@app.route('/products', methods=['GET'])
@request_counter
def get_products():
    app.logger.info('Products list requested')
    try:
        with db_query_duration.time():
            products = Product.query.all()
            products_list = [{'name': product.name, 'description': product.description, 'price': product.price} for product in products]
        app.logger.info(f'Returned {len(products_list)} products')
        return jsonify(products_list)
    except Exception as e:
        app.logger.error(f'Error fetching products: {str(e)}')
        return jsonify({'message': 'Error fetching products!'}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        initialize_products()
    app.run(host='0.0.0.0', port=5000, debug=True)
