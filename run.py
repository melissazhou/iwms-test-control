from app import create_app

app = create_app()

if __name__ == '__main__':
    port = app.config.get('APP_PORT', 5077)
    app.run(host='0.0.0.0', port=port, debug=False)
