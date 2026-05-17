FROM public.ecr.aws/lambda/python:3.11

# Install C/C++ toolchain. Amazon Linux 2 uses yum.
RUN yum install -y gcc gcc-c++ make cmake && yum clean all

COPY requirements.txt ${LAMBDA_TASK_ROOT}

RUN pip install --no-cache-dir -r requirements.txt --target ${LAMBDA_TASK_ROOT}

COPY predict.py ${LAMBDA_TASK_ROOT}

CMD ["predict.lambda_handler"]