FROM php:8.0-apache

# Fix potential timezone issues
ENV TZ=Asia/Jakarta
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Update and install dependencies
RUN apt-get -o Acquire::Check-Valid-Until=false \
    -o Acquire::Check-Date=false update \
    && apt-get install -y --no-install-recommends \
    mariadb-client \
    libmariadb-dev \
    && docker-php-ext-install pdo_mysql \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Enable Apache modules
RUN a2enmod rewrite

# Set working directory
WORKDIR /var/www/html

# Copy application files
COPY . /var/www/html/

# Configure Apache and permissions
RUN echo "ServerName localhost" >> /etc/apache2/apache2.conf && \
    echo '<Directory /var/www/html/>' > /etc/apache2/conf-available/rewrite.conf && \
    echo 'Options Indexes FollowSymLinks' >> /etc/apache2/conf-available/rewrite.conf && \
    echo 'AllowOverride All' >> /etc/apache2/conf-available/rewrite.conf && \
    echo 'Require all granted' >> /etc/apache2/conf-available/rewrite.conf && \
    echo '</Directory>' >> /etc/apache2/conf-available/rewrite.conf && \
    a2enconf rewrite && \
    chown -R www-data:www-data /var/www/html && \
    echo "DirectoryIndex index.php index.html" >> /etc/apache2/apache2.conf

EXPOSE 80

CMD ["apache2-foreground"]
